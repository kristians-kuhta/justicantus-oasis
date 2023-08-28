const path = require('path');
const os = require('os');
const fs = require('fs');

const FormData = require('form-data');
const axios = require('axios');
const Busboy = require('busboy');
const IPFS_ADD_ENDPOINT = 'https://ipfs.infura.io:5001/api/v0/add';

const corsMiddleware = require('../../middlewares/corsMiddleware.js');

const PIN_OPTIONS = {
  params: { pin: 'true' },
  auth: { username: INFURA_API_KEY, password: INFURA_API_SECRET },
  headers: {
    'Content-Type': 'multipart/form-data'
  },
};

const pinFile = async (formData) => {
  return axios.post(IPFS_ADD_ENDPOINT, formData, PIN_OPTIONS);
};

const pinFileToIpfs = async (uploads) => {
  const { INFURA_API_KEY, INFURA_API_SECRET } = process.env;

  const formData = new FormData();
  formData.append('file', fs.readFileSync(uploads['file']));

  const pinAudioFileResponse = await pinFile(formData);;
  const audioFileCid = pinAudioFileResponse.data.Hash;

  const jsonContent = JSON.stringify({ title: fields['title'], cid: audioFileCid });

  // Write final json object to tmp file
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, 'final.json');

  fs.writeFileSync(tmpFile, jsonContent);

  const secondFormData = new FormData();
  secondFormData.append('file', fs.createReadStream(tmpFile));

  try {
    const metadataPinResponse = await pinFile(secondFormData);

    res.status(metadataPinResponse.status).json(metadataPinResponse.data);
  } catch (e) {
    console.error(e);
    res.status(500).send('An error occured while pinning the file');
  }

  // Remove final json object tmp file
  fs.unlinkSync(tmpFile);
};

const handlePinFile = (req, res) => {
  corsMiddleware(req, res, () => {
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
      const filepath = path.join(tmpdir, filename);
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
      await pinFileToIpfs(uploads);
    });

    busboy.end(req.rawBody);
  });
};

functions.http('pinFile', handlePinFile);
