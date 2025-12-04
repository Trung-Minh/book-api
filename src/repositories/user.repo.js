import { ObjectId } from 'mongodb'

import { getDB } from '~/config/db.js'

const COLLECTION_NAME = 'users'

class UserRepository {
  getCollection() {
    return getDB().collection(COLLECTION_NAME)
  }

  async create(userData) {
    const doc = {
      username: userData.username,
      password_hash: userData.password_hash,
      full_name: userData.full_name,
      role: userData.role,
      status: userData.status,
      created_at: new Date(),
      updated_at: new Date(),
      _deleted: false
    }

    const result = await this.getCollection().insertOne(doc)

    const { password_hash, _deleted, ...ret } = doc
    return { _id: result.insertedId, ...ret }
  }

  async findByUsername(username) {
    return await this.getCollection().findOne({
      username,
      _deleted: false
    })
  }

  async findAnyByUsername(username) {
    return await this.getCollection().findOne({ username })
  }

  async findById(id) {
    if (!ObjectId.isValid(id)) return null
    return await this.getCollection().findOne(
      { _id: new ObjectId(id), _deleted: false },
      { projection: { password_hash: 0, _deleted: 0 } }
    )
  }

  async findAll({ filter, page, limit, sort }) {
    const skip = (page - 1) * limit
    const query = { ...filter, _deleted: false }

    const cursor = this.getCollection()
      .find(query)
      .project({ password_hash: 0, _deleted: 0 })
      .sort(sort)
      .skip(skip)
      .limit(limit)

    const users = await cursor.toArray()
    const total = await this.getCollection().countDocuments(query)

    return { users, total }
  }

  async update(id, updateData) {
    if (!ObjectId.isValid(id)) return null
    return await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id), _deleted: false },
      { $set: { ...updateData, updated_at: new Date() } },
      { returnDocument: 'after', projection: { password_hash: 0, _deleted: 0 } }
    )
  }

  async restore(id, newData) {
    return await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...newData,
          _deleted: false,
          status: 'ACTIVE',
          updated_at: new Date()
        }
      },
      { returnDocument: 'after', projection: { password_hash: 0, _deleted: 0 } }
    )
  }

  async delete(id) {
    if (!ObjectId.isValid(id)) return false

    const result = await this.getCollection().updateOne(
      { _id: new ObjectId(id), _deleted: false },
      {
        $set: {
          _deleted: true,
          status: 'LOCKED',
          updated_at: new Date()
        }
      }
    )
    return result.modifiedCount > 0
  }

  // Xóa cứng
  async deleteForce(id) {
    if (!ObjectId.isValid(id)) return false

    const result = await this.getCollection().deleteOne({
      _id: new ObjectId(id)
    })
    return result.deletedCount > 0
  }
}

export default new UserRepository()
