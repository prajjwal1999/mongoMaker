const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
const port = 3000;

// Multer configuration to restrict uploads to CSV files
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true); // Accept the upload
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'), false); // Reject the upload
    }
  },
});

app.set('view engine', 'ejs'); // Set EJS as the templating engine
app.use(express.static('public')); // Serve static files from the "public" directory

app.get('/', (req, res) => {
  const currentTime = new Date().toLocaleString();
  res.render('index', { currentTime }); // Render the "index.ejs" template and pass data to it
});

app.post('/upload', upload.single('csvFile'), (req, res) => {
  const filePath = req.file.path;
  const deb = [];
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', () => {
      for (let i = 0; i < results.length; i++) {
        let part1 = 'db.location.insertOne({"city":';
        let part2 = ',"state":';
        let part3 = ',"city_type":';
        let part4 = ',"created_at":';
        let part5 = ',"updated_at":';
        let part6 = ',"team":';
        var cmd = (part1 + '"' + results[i].city + '"' + part2 + '"' + results[i].state + '"' + part3 + '"' + results[i].city_type + '"' + part4 + 'new Date()' + part5 + 'new Date()' + part6 + '"' + results[i].team) + '"' + ' });';
        deb.push(cmd);
      }
      const outputFilePath = 'output.js';
      const outputText = deb.map(row => (row)).join('\n');

      fs.writeFile(outputFilePath, outputText, 'utf8', (err) => {
        if (err) {
          console.error('Error writing to file:', err);
        } else {
          console.log(`Results written to ${outputFilePath}`);
          // Send the file as a response attachment
          res.setHeader('Content-Disposition', `attachment; filename=${outputFilePath}`);
          res.setHeader('Content-Type', 'application/javascript');
          res.download(outputFilePath, () => {
            // Cleanup: Delete the generated file after it's downloaded
            fs.unlink(outputFilePath, (err) => {
              if (err) {
                console.error('Error deleting file:', err);
              }
              // Delete the uploaded file as well
              fs.unlink(filePath, (err) => {
                if (err) {
                  console.error('Error deleting uploaded file:', err);
                }
              });
            });
          });
        }
      });
      // Perform desired operations with the parsed CSV data (results array)
      console.log(results);
    });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
