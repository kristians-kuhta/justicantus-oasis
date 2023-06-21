const path = require('path');
const os = require('os');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const functions = require('@google-cloud/functions-framework');

// Node.js doesn't have a built-in multipart/form-data parsing library.
// Instead, we can use the 'busboy' library from NPM to parse these requests.
const Busboy = require('busboy');

// TODO: decide on what kind of additional data needs to be logged, if any
functions.http('pinFile', (req, res) => {
  if (req.method !== 'POST') {
    // Return a "method not allowed" error
    return res.status(405).end();
  }
  const busboy = Busboy({headers: req.headers});
  const tmpdir = os.tmpdir();
  // The tmp file where the final JSON object will be written
  const finalTmpFilePath = path.join(tmpdir, 'final.json');

  // This object will accumulate all the fields, keyed by their name
  const fields = {};

  // This object will accumulate all the uploaded files, keyed by their name.
  const uploads = {};

  const pinFileToIpfs = async () => {
    const { INFURA_API_KEY, INFURA_API_SECRET } = process.env;

    const formData = new FormData();
    formData.append('file', fs.readFileSync(uploads['file']));

    const options = {
      params: { pin: 'true' },
      auth: { username: INFURA_API_KEY, password: INFURA_API_SECRET },
      headers: {
        'Content-Type': 'multipart/form-data'
      },
    };

    const firstResponse = await axios.post('https://ipfs.infura.io:5001/api/v0/add', formData, options);
    const cid = firstResponse.data.Hash;

    const jsonContent = JSON.stringify({ title: fields['title'], cid });

    // Write final json object to tmp file
    fs.writeFileSync(finalTmpFilePath, jsonContent);

    const secondFormData = new FormData();
    secondFormData.append('file', fs.createReadStream(finalTmpFilePath));

    try {
      const secondResponse = await axios.post('https://ipfs.infura.io:5001/api/v0/add', secondFormData, options);
      const secondResponseJson = secondResponse.data;

      res.status(secondResponse.status).json(secondResponse.data);
    } catch (e) {
      console.error(e);
      res.status(500).send('An error occured while pinning the file');
    }

    // Remove final json object tmp file
    fs.unlinkSync(finalTmpFilePath);
  };

  // This code will process each non-file field in the form.
  busboy.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  const fileWrites = [];

  // This code will process each file uploaded.
  busboy.on('file', (fieldname, file, {filename}) => {
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
      file.on('end', () => {
        writeStream.end();
      });
      writeStream.on('close', resolve);
      writeStream.on('error', reject);
    });
    fileWrites.push(promise);
  });

  // Triggered once all uploaded files are processed by Busboy.
  // We still need to wait for the disk writes (saves) to complete.
  busboy.on('finish', async () => {
    await Promise.all(fileWrites);

    await pinFileToIpfs();

    // NOTE: in case there are more than one file form file sent, clean up behind all of them
    uploads.forEach((upload) => {
      fs.unlinkSync(upload);
    });
  });

  busboy.end(req.rawBody);
});

