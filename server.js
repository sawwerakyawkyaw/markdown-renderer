import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8000;

// Serve static files (HTML, CSS, bundled JS)
app.use(express.static('public'));
app.use('/dist', express.static('dist'));

// API endpoint to get markdown file content
app.get('/api/markdown/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'test', filename);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).json({ error: 'Error reading file' });
    } else {
      res.json({ content: data });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
