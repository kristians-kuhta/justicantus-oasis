const path = require('path');
const os = require('os');
const fs = require('fs');

const FormData = require('form-data');
const axios = require('axios');
const Busboy = require('busboy');
const functions = require('@google-cloud/functions-framework');
const sodium = require('libsodium-wrappers');
const ethers = require("ethers");

require('dotenv').config()

const corsMiddleware = require('../../middlewares/corsMiddleware.js');

const {
  IPFS_API_KEY,
  IPFS_API_SECRET,
  IPFS_ADD_ENDPOINT,
  PRC_API_URL,
  ENCRYPTOR_PRIVATE_KEY
} = process.env;

const provider = new ethers.providers.JsonRpcProvider(PRC_API_URL);
const encryptor = new ethers.Wallet(ENCRYPTOR_PRIVATE_KEY, provider);

const contractAddresses = require("../../contracts/contract-addresses.json");
const PlatformArtifact = require("../../contracts/Platform.json");
const platform = new ethers.Contract(
  contractAddresses.Platform,
  PlatformArtifact.abi,
  encryptor
);

const PIN_OPTIONS = {
  params: { pin: 'true' },
  auth: { username: IPFS_API_KEY, password: IPFS_API_SECRET },
  headers: {
    'Content-Type': 'multipart/form-data'
  },
};

const pinFile = async (formData) => {
  return axios.post(IPFS_ADD_ENDPOINT, formData, PIN_OPTIONS);
};

const getEncryptionKey = async () => {
  const message = encryptor.address.toLowerCase();
  const encodedAccount = ethers.utils.defaultAbiCoder.encode(['address'], [message]);
  const messageHash = ethers.utils.keccak256(encodedAccount);
  const signedData = ethers.utils.arrayify(messageHash);

  const signature = await encryptor.signMessage(signedData);

  return await platform.getEncryptionKey(encryptor.address, signature);
};

const encryptData = async (encryptionKeyBytes, filePath) => {
  await sodium.ready;

  const inputFileBuffer = fs.readFileSync(filePath);

  const pushStream = sodium.crypto_secretstream_xchacha20poly1305_init_push(encryptionKeyBytes);
  const { state, header } = pushStream;

  const encryptedChunks = [];
  encryptedChunks.push(header);

  const chunk = sodium.crypto_secretstream_xchacha20poly1305_push(
    state,
    inputFileBuffer,
    null,
    sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
  );
  encryptedChunks.push(chunk);

  return Buffer.concat(encryptedChunks);
};

const encryptFile = async (encryptionKeyBytes, outFilePath, fileContent) => {
  fs.writeFileSync(outFilePath, fileContent);

  const data = await encryptData(encryptionKeyBytes, outFilePath);

  fs.writeFileSync(outFilePath, data);

  return fs.createReadStream(outFilePath);
};

const pinFileToIpfs = async (res, uploads, fields) => {
  const encryptionKey = await getEncryptionKey();
  const encryptionKeyBytes = sodium.from_hex(encryptionKey.slice(2));

  const tmpDir = os.tmpdir();
  const outFilePath = path.join(tmpDir, 'file.enc');

  const formData = new FormData();
  const encryptedAudioFile = await encryptFile(
    encryptionKeyBytes,
    outFilePath,
    fs.readFileSync(uploads['file'])
  );
  formData.append('file', encryptedAudioFile);

  const pinAudioFileResponse = await pinFile(formData);
  const audioFileCid = pinAudioFileResponse.data.Hash;

  const fileContent = JSON.stringify({ title: fields['title'], cid: audioFileCid });

  const secondFormData = new FormData();
  const encryptedFile = await encryptFile(encryptionKeyBytes, outFilePath, fileContent);
  secondFormData.append('file', encryptedFile);

  try {
    const metadataPinResponse = await pinFile(secondFormData);

    res.status(metadataPinResponse.status).json(metadataPinResponse.data);
  } catch (e) {
    console.error(e);
    res.status(500).send('An error occured while pinning the file');
  }

  fs.unlinkSync(outFilePath);
};

const handlePinFile = (req, res) => {
  corsMiddleware(req, res, 'POST', () => {
    const busboy = Busboy({headers: req.headers});
    //
    // This object will accumulate all the fields, keyed by their name
    const fields = {};

    // This object will accumulate all the uploaded files, keyed by their name.
    const uploads = {};

    // This code will process each non-file field in the form.
    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    const fileWrites = [];

    // This code will process each file uploaded.
    busboy.on('file', (fieldname, file, { filename }) => {
      // Note: os.tmpdir() points to an in-memory file system on GCF
      // Thus, any files in it must fit in the instance's memory.
      const tmpDir = os.tmpdir();
      const filepath = path.join(tmpDir, filename);
      uploads[fieldname] = filepath;

      const writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);

      // File was processed by Busboy; wait for it to be written.
      // Note: GCF may not persist saved files across invocations.
      // Persistent files must be kept in other locations
      // (such as Cloud Storage buckets).
      const promise = new Promise((resolve, reject) => {
        file.on('end', () => writeStream.end());

        writeStream.on('close', resolve);
        writeStream.on('error', reject);
      });

      fileWrites.push(promise);
    });

    // Triggered once all uploaded files are processed by Busboy.
    // We still need to wait for the disk writes (saves) to complete.
    busboy.on('finish', async () => {
      await Promise.all(fileWrites);
      await pinFileToIpfs(res, uploads, fields);
    });

    busboy.end(req.rawBody);
  });
};

functions.http('pinFile', handlePinFile);

module.exports = { handlePinFile };
