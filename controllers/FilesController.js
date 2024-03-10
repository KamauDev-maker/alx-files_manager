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

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      if (parentId !== 0) {
        const parentFile = await dbClient.getFileById(parentId);

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const fileObject = {
        userId,
        name,
        type,
        isPublic,
        parentId,
      };

      if (type === 'folder') {
        const newFile = await dbClient.insertFile(fileObject);
        return res.status(201).json(newFile);
      }

      const storingFolder = process.env.FOLDER_PATH || '/tmp/files_manager';
      const localPath = path.join(storingFolder, uuidv4());

      await fs.writeFile(localPath, Buffer.from(data, 'base64'));

      fileObject.localPath = localPath;

      const newFile = await dbClient.insertFile(fileObject);

      return res.status(201).json(newFile);
    } catch (error) {
      console.error(`Error uploading file: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // eslint-disable-next-line consistent-return
  static async getShow(req, res) {
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

      const fileId = req.params.id;

      const file = await dbClient.getFileByIdAndUserId(fileId, userId);

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json(file);
    } catch (error) {
      console.error(`Error getting file by ID: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // eslint-disable-next-line consistent-return
  static async getIndex(req, res) {
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

      const parentId = req.query.parentId || 0;
      // eslint-disable-next-line radix
      const page = parseInt(req.query.page) || 0;
      const pageSize = 20;

      const files = await dbClient.getFilesByUserIdAndParentId(userId, parentId, page, pageSize);

      return res.status(200).json(files);
    } catch (error) {
      console.error(`Error getting files: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // eslint-disable-next-line consistent-return
  static async putPublish(req, res) {
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

      const fileId = req.params.id;

      const file = await dbClient.getFileByIdAndUserId(fileId, userId);

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      const updatedFile = await dbClient.updateFileIsPublic(fileId, true);

      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error(`Error publishing file: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // eslint-disable-next-line consistent-return
  static async putUnpublish(req, res) {
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

      const fileId = req.params.id;

      const file = await dbClient.getFileByIdAndUserId(fileId, userId);

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      const updatedFile = await dbClient.updateFileIsPublic(fileId, false);

      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error(`Error unpublishing file: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
