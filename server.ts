import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

const app = express();
const PORT = 3000; // API port

// Enable CORS for the frontend
app.use(cors({ origin: 'http://localhost:6655' }));

// Setup API routes
const apiRouter = Router();
app.use('/api', apiRouter);

// API endpoint to get caption files from a directory
apiRouter.get('/captions', (req: Request, res: Response) => {
  (async () => {
    try {
      const dirPath = req.query.dir as string;
      if (!dirPath) {
        return res.status(400).json({ error: 'Directory path is required' });
      }

      // Check if directory exists
      try {
        const stats = await stat(dirPath);
        if (!stats.isDirectory()) {
          return res.status(400).json({ error: 'Path is not a directory' });
        }
      } catch (error) {
        return res.status(404).json({ error: 'Directory not found' });
      }

      // Get all txt files in the directory and its subdirectories
      const captionFiles = await findCaptionFiles(dirPath);
      
      // Load the content of each file
      const results = await Promise.all(
        captionFiles.map(async (filePath) => {
          const content = await readFile(filePath, 'utf-8');
          const relativePath = path.relative(dirPath, filePath);
          const folder = path.dirname(relativePath);
          const fileName = path.basename(filePath);
          
          return {
            path: filePath,
            caption: content.trim(),
            fileName,
            folder: folder === '.' ? '' : folder,
          };
        })
      );

      res.json(results);
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })();
});

// API endpoint to get the content of a specific caption file
apiRouter.get('/caption-content', (req: Request, res: Response) => {
  (async () => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }

      // Check if file exists
      try {
        const stats = await stat(filePath);
        if (!stats.isFile()) {
          return res.status(400).json({ error: 'Path is not a file' });
        }
      } catch (error) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Read file content
      const content = await readFile(filePath, 'utf-8');
      res.send(content);
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })();
});

// Recursive function to find caption files
async function findCaptionFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return findCaptionFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.txt')) {
        return [fullPath];
      }
      return [];
    })
  );
  
  return files.flat();
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 