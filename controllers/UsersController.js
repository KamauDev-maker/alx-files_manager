/* eslint-disable import/no-extraneous-dependencies */
import { ObjectId } from 'mongodb';

const { SHA1 } = require('crypto-js');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  // eslint-disable-next-line consistent-return
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      const existingUser = await dbClient.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = SHA1(password).toString();

      const newUser = {
        email,
        password: hashedPassword,
      };

      const result = await dbClient.insertUser(newUser);

      const createdUser = {
        id: result.insertedId,
        email: result.ops[0].email,
      };

      res.status(201).json(createdUser);
    } catch (error) {
      console.error(`Error creating user: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(request, response) {
    try {
      const userToken = request.header('X-Token');
      const authKey = `auth_${userToken}`;

      const userID = await redisClient.get(authKey);
      console.log('USER KEY GET ME', userID);
      if (!userID) {
        response.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.getUser({ _id: ObjectId(userID) });

      response.json({ id: user._id, email: user.email });
    } catch (error) {
      console.log(error);
      response.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = UsersController;
