// controllers/FilesController.js

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class FilesController {
  // eslint-disable-next-line consistent-return
  static async postUpload(req, res) {
    try {
      const token = req.headers['x-token'];

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        name,
        type,
        parentId = 0,
        isPublic = false,
        data,
      } = req.body;

      // Check required fields
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Check parentId
      if (parentId !== 0) {
        const parentFile = await dbClient.getFileById(parentId);

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Prepare file object for DB
      const fileObject = {
        userId,
        name,
        type,
        isPublic,
        parentId,
      };

      // Handle folder type
      if (type === 'folder') {
        const newFile = await dbClient.insertFile(fileObject);
        return res.status(201).json(newFile);
      }

      // Handle file and image types
      const storingFolder = process.env.FOLDER_PATH || '/tmp/files_manager';
      const localPath = path.join(storingFolder, uuidv4());

      // Save file locally
      await fs.writeFile(localPath, Buffer.from(data, 'base64'));

      // Update file object for DB
      fileObject.localPath = localPath;

      // Insert file into DB
      const newFile = await dbClient.insertFile(fileObject);

      return res.status(201).json(newFile);
    } catch (error) {
      console.error(`Error uploading file: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
