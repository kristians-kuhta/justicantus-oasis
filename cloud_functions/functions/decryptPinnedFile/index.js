const path = require('path');
const os = require('os');
const fs = require('fs');
const { pipeline } = require('stream');
const util = require('util');
const fileType = require('file-type')

const FormData = require('form-data');
const axios = require('axios');

const functions = require('@google-cloud/functions-framework');

const sodium = require('libsodium-wrappers');
const ethers = require("ethers");

// const IPFS_ENDPOINT = 'https://ipfs.io/ipfs/';

const corsMiddleware = require('../../middlewares/corsMiddleware.js');

const pipelinePromisified = util.promisify(pipeline);

const {
  INFURA_API_KEY,
  INFURA_API_SECRET,
  INFURA_URL,
  IPFS_ENDPOINT,
  ENCRYPTOR_PRIVATE_KEY
} = process.env;

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
const encryptor = new ethers.Wallet(ENCRYPTOR_PRIVATE_KEY, provider);

const contractAddresses = require("../../contracts/contract-addresses.json");
const PlatformArtifact = require("../../contracts/Platform.json");
const platform = new ethers.Contract(
  contractAddresses.Platform,
  PlatformArtifact.abi,
  encryptor
);

const IPFS_OPTIONS = {
  auth: { username: INFURA_API_KEY, password: INFURA_API_SECRET }
};

const fetchAndWriteFile = async (tmpFile, cid) => {
  const base64Credentials = Buffer.from(`${INFURA_API_KEY}:${INFURA_API_SECRET}`).toString('base64');

  const headers = { 'Authorization': `Basic ${base64Credentials}` };

  const response = await fetch(IPFS_ENDPOINT + cid, { headers });
  const fileStream = fs.createWriteStream(tmpFile);

  await pipelinePromisified(response.body, fileStream);
};

const getEncryptionKey = async () => {
  const message = encryptor.address.toLowerCase();
  const encodedAccount = ethers.utils.defaultAbiCoder.encode(['address'], [message]);
  const messageHash = ethers.utils.keccak256(encodedAccount);
  const signedData = ethers.utils.arrayify(messageHash);

  const signature = await encryptor.signMessage(signedData);

  return await platform.getEncryptionKey(encryptor.address, signature);
};

const decryptFile = async (filePath, encryptionKeyBytes) => {
  await sodium.ready;

  const encryptedFileBuffer = fs.readFileSync(filePath);

  const headerBytes = sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES;
  const header = encryptedFileBuffer.slice(0, headerBytes);
  const encryptedData = encryptedFileBuffer.slice(headerBytes);

  const stream = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
    header,
    encryptionKeyBytes
  );

  const decryptedData = sodium.crypto_secretstream_xchacha20poly1305_pull(stream, encryptedData);

  return decryptedData;
};

const handleDecryptPinnedFile = async (req, res) => {
  corsMiddleware(req, res, 'GET', async () => {
    // 1. require cid presence
    if (!req.query || !req.query.cid) {
      return res.status(400).send('Must provide CID');
    }

    if (!req.query || !req.query.account) {
      return res.status(400).send('Must provide account that requests decryption');
    }

    // 2. fetch file by cid
    const tmpFile = path.join(os.tmpdir(), 'file.enc');
    try {
      await fetchAndWriteFile(tmpFile, req.query.cid);

      // 3. get encryption key
      const encryptionKey = await getEncryptionKey();
      const encryptionKeyBytes = sodium.from_hex(encryptionKey.slice(2));

      // 4. decrypt file
      const decryptedData = await decryptFile(tmpFile, encryptionKeyBytes);

      if (!decryptedData || !decryptedData.message) throw Error('Data could not be decrypted');

      const detectedFileType = fileType(decryptedData.message);
      const contentType = detectedFileType ? detectedFileType.mime : 'application/octet-stream';

      // 5. Set the appropriate response headers.
      res.setHeader('Content-Type', contentType);

      // 6. respond with decrypted file
      return res.end(decryptedData.message);
    } catch (e) {
      console.error(e.message);
      return res.status(400).send('Could not decrypt file');
    }
  });
};

functions.http('decryptPinnedFile', handleDecryptPinnedFile);

module.exports = { handleDecryptPinnedFile };
