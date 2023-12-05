/* eslint-disable import/no-extraneous-dependencies */
const { SHA1 } = require('crypto-js');
const dbClient = require('../utils/db');

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
}

module.exports = UsersController;
