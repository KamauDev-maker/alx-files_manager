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

  async getFileByIdAndUserId(fileId, userId) {
    const filesCollection = this.client.db().collection('files');
    return filesCollection.findOne({ _id: this.client.ObjectID(fileId), userId });
  }

  async getFilesByUserIdAndParentId(userId, parentId, page, pageSize) {
    const filesCollection = this.client.db().collection('files');

    const skip = page * pageSize;

    const pipeline = [
      { $match: { userId, parentId } },
      { $skip: skip },
      { $limit: pageSize },
    ];

    return filesCollection.aggregate(pipeline).toArray();
  }

  async updateFileIsPublic(fileId, isPublic) {
    const filesCollection = this.client.db().collection('files');
    const result = await filesCollection.findOneAndUpdate(
      { _id: this.client.ObjectID(fileId) },
      { $set: { isPublic } },
      { returnDocument: 'after' },
    );
    return result.value;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
