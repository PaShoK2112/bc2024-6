const express = require('express');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const multer = require('multer');
const bodyParser = require("body-parser");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notes API',
      version: '1.0.0',
      description: 'API for managing notes'
    },
    servers: [
      {
        url: `http://${options.host}:${options.port}`
      }
    ]
  },
  apis: [__filename], // Documenting APIs in this file
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
lab5.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /notes/{note_name}:
 *   get:
 *     summary: Get a note by name
 *     parameters:
 *       - in: path
 *         name: note_name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the note
 *     responses:
 *       200:
 *         description: Note content
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Note not found
 */
lab5.get('/notes/:note_name', (req, res) => {
  const path_to_note = path.join(options.cache, `${req.params.note_name}.txt`);
  fs.readFile(path_to_note, null, (err, data) => {
    if (err) {
      return res.status(404).send('Not found');
    }
    res.send(data);
  });
});

/**
 * @swagger
 * /notes/{note_name}:
 *   put:
 *     summary: Update a note
 *     parameters:
 *       - in: path
 *         name: note_name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the note to update
 *     requestBody:
 *       description: Note content to update
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: Note updated
 *       404:
 *         description: Note not found
 */
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

/**
 * @swagger
 * /notes/{note_name}:
 *   delete:
 *     summary: Delete a note
 *     parameters:
 *       - in: path
 *         name: note_name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the note to delete
 *     responses:
 *       200:
 *         description: Note deleted
 *       404:
 *         description: Note not found
 */
lab5.delete('/notes/:note_name', (req, res) => {
    const path_to_note = path.join(options.cache, `${req.params.note_name}.txt`);
    fs.unlink(path_to_note, (err) => {
      if (err) {
        return res.status(404).send('Not found');
      }
      res.send('Deleted');
    });
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Get a list of all notes
 *     responses:
 *       200:
 *         description: List of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   text:
 *                     type: string
 */
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

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Create a new note
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created
 *       400:
 *         description: Bad request
 */
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

lab5.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});
