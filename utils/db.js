const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    this.client.connect()
      .then(() => {
        console.log('Connected to MongoDB');
      })
      .catch((err) => {
        console.error(`MongoDB Connection Error: ${err}`);
      });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    try {
      const usersCollection = this.client.db().collection('users');
      return await usersCollection.countDocuments();
    } catch (error) {
      console.error(`Error counting users: ${error}`);
      throw error;
    }
  }

  async nbFiles() {
    try {
      const filesCollection = this.client.db().collection('files');
      return await filesCollection.countDocuments();
    } catch (error) {
      console.error(`Error counting files: ${error}`);
      throw error;
    }
  }

  async getUserByEmail(email) {
    const usersCollection = this.client.db().collection('users');
    return usersCollection.findOne({ email });
  }

  async insertUser(user) {
    const usersCollection = this.client.db().collection('users');
    return usersCollection.insertOne(user);
  }

  async getFileById(fileId) {
    const filesCollection = this.client.db().collection('files');
    return filesCollection.findOne({ _id: this.client.ObjectID(fileId) });
  }

  async insertFile(file) {
    const filesCollection = this.client.db().collection('files');
    const result = await filesCollection.insertOne(file);
    return result.ops[0];
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
