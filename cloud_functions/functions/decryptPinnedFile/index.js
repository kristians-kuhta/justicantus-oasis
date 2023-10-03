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
const { BigNumber } = ethers;

const corsMiddleware = require('./middlewares/corsMiddleware.js');

const pipelinePromisified = util.promisify(pipeline);

require('dotenv').config();

const {
  IPFS_API_KEY,
  IPFS_API_SECRET,
  IPFS_API_URL,
  RPC_API_URL,
  ENCRYPTOR_PRIVATE_KEY
} = process.env;

const provider = new ethers.providers.JsonRpcProvider(RPC_API_URL);
const encryptor = new ethers.Wallet(ENCRYPTOR_PRIVATE_KEY, provider);

const contractAddresses = require("../../contracts/contract-addresses.json");
const PlatformArtifact = require("../../contracts/Platform.json");
const platform = new ethers.Contract(
  contractAddresses.Platform,
  PlatformArtifact.abi,
  encryptor
);

const fetchAndWriteFile = async (tmpFile, cid) => {
  const base64Credentials = Buffer.from(`${IPFS_API_KEY}:${IPFS_API_SECRET}`).toString('base64');

  const headers = { 'Authorization': `Basic ${base64Credentials}` };

  const response = await fetch(IPFS_API_URL + cid, { headers });
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

const verifyAccountHasAccess = async (account, cid) => {
  if (await platform.isActiveSubscriber(account)) return true;

  return (await platform.getArtistId(account)).toString() !== BigNumber.from(0);
};

const verifyAccountSignature = async (account, signature) => {
  const message = account.toLowerCase();
  const encodedAccount = ethers.utils.defaultAbiCoder.encode(['address'], [message]);
  const messageHash = ethers.utils.keccak256(encodedAccount);
  const signedData = ethers.utils.arrayify(messageHash);

  const signer = await ethers.utils.verifyMessage(signedData, signature);

  return signer.toLowerCase() === message;
};

const validationError = (error, errorStatusCode) => {
  return { error, errorStatusCode };
};

const validateRequestParams = async (req) => {
  if (!req.query) return validationError('Invalid params', 400);

  const { cid, account, signature } = req.query;

  if (!cid || !account || !signature) return validationError('Missing params', 400);
  if (!(await verifyAccountSignature(account, signature))) return validationError('Invalid signature', 400);
  if (!(await verifyAccountHasAccess(account, cid))) return validationError('Access denied', 403);

  return { error: null, errorStatusCode: null };
};

const handleDecryptPinnedFile = async (req, res) => {
  corsMiddleware(req, res, 'GET', async () => {
    const { error, errorStatusCode } = await validateRequestParams(req);

    if (error) return res.status(errorStatusCode).send(error);

    // 2. fetch file by cid
    const tmpFile = path.join(os.tmpdir(), 'file.enc');
    fs.writeFileSync(tmpFile, '');
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
