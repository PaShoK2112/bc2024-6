const express = require('express');
const fs = require('fs');
const path = require('path');
const {program} = require('commander');
const multer = require('multer');
const bodyParser = require("body-parser");

const mlt = multer();


program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <cachePath>', 'cache directory');
program.parse(process.argv);

const options = program.opts();
const lab5 = express();
lab5.use(express.json());
lab5.use(bodyParser.raw({ type: "text/plain" }));



lab5.get('/notes/:note_name', (req, res) => {
  const path_to_note = path.join(options.cache, `${req.params.note_name}.txt`);
  fs.readFile(path_to_note, null, (err, data) => {
    if (err) {
      return res.status(404).send('Not found');
    }
    res.send(data);
  });
});

lab5.put('/notes/:note_name', (req, res) => {
  const noteName = req.params.note_name.trim(); 
  const path_to_note = path.join(options.cache, `${noteName}.txt`);

  fs.access(path_to_note, fs.constants.F_OK, (err) => {
      if (err) {
          return res.status(404).send('Not found');
      }
      fs.writeFile(path_to_note, req.body.toString(), (err) => {
          if (err) {
              console.error(err);
              return res.status(500).send('Internal Server Error');
          }
          res.send('Updated');
      });
  });
});

lab5.delete('/notes/:note_name', (req, res) => {
    const path_to_note = path.join(options.cache, `${req.params.note_name}.txt`);
    fs.unlink(path_to_note, (err) => {
      if (err) {
        return res.status(404).send('Not found');
      }
      res.send('Deleted');
    });
});

lab5.get('/notes', (req, res) => {
    fs.readdir(options.cache, (err, files) => {
      if (err) throw err;
      const notes = files.map((file) => {
        const data = fs.readFileSync(path.join(options.cache, file), 'utf-8');
        return {name: path.basename(file), text: data };
      });
      res.json(notes);
    });
});

lab5.post('/write', mlt.none(), (req, res) => {
    const path_to_note = path.join(options.cache, `${req.body.note_name}.txt`);
    fs.access(path_to_note, fs.constants.F_OK, (err) => {
      if (!err) {
        return res.status(400).send('Bad request');
      }
      fs.writeFile(path_to_note, req.body.note, (err) => {
        if (err) throw err;
        res.status(201).send('Created');
      });
    });
});

lab5.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'UploadForm.html'));
});


lab5.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});