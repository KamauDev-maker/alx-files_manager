/* eslint-disable no-sequences */
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AppController {
  static async getStatus(req, res) {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();

    const status = {
      redis: redisAlive,
      db: dbAlive,
    };
    // eslint-disable-next-line no-unused-expressions
    res, status(200).json(status);
  }

  static async getStats(req, res) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();

      const stats = {
        users: usersCount,
        files: filesCount,
      };

      res.status(200).json(stats);
    } catch (err) {
      console.error(`Error getting stats: ${err}`);
      res.status(500).json({ err: 'Internal Server Error' });
    }
  }
}

module.exports = AppController;
