import { getDB } from '~/config/db.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'books'

class BookRepository {
  getCollection() {
    return getDB().collection(COLLECTION_NAME)
  }

  async create(bookData) {
    const doc = {
      ...bookData,
      inventory: { total_copies: 0, available_copies: 0 },
      created_at: new Date(),
      updated_at: new Date(),
      _deleted: false
    }
    const result = await this.getCollection().insertOne(doc)

    const { _deleted, ...resultDoc } = doc

    return { _id: result.insertedId, ...resultDoc }
  }

  async findByISBN(isbn) {
    return await this.getCollection().findOne({ isbn, _deleted: false })
  }

  async findAnyByISBN(isbn) {
    return await this.getCollection().findOne({ isbn })
  }

  async findById(id) {
    if (!ObjectId.isValid(id)) return null
    return await this.getCollection().findOne(
      {
        _id: new ObjectId(id),
        _deleted: false
      },
      { projection: { _deleted: 0 } }
    )
  }

  async findAll({ filter, page, limit, sort }) {
    const skip = (page - 1) * limit

    const query = { ...filter, _deleted: false }

    const cursor = this.getCollection()
      .find(query)
      .project({ _deleted: 0 })
      .sort(sort)
      .skip(skip)
      .limit(limit)

    const books = await cursor.toArray()
    const total = await this.getCollection().countDocuments(query)

    return { books, total }
  }

  async update(id, updateData) {
    if (!ObjectId.isValid(id)) return null

    const result = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updated_at: new Date() } },
      { returnDocument: 'after', projection: { _deleted: 0 } }
    )
    return result
  }

  async restore(id, newData) {
    if (!ObjectId.isValid(id)) return null

    const result = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...newData,
          _deleted: false,
          updated_at: new Date()
        }
      },
      {
        returnDocument: 'after',
        projection: { _deleted: 0 }
      }
    )
    return result
  }

  // Cập nhật tồn kho
  async updateInventory(bookId, totalChange, availableChange) {
    if (!ObjectId.isValid(bookId)) return

    await this.getCollection().updateOne(
      { _id: new ObjectId(bookId) },
      {
        $inc: {
          'inventory.total_copies': totalChange,
          'inventory.available_copies': availableChange
        },
        $set: { update_at: new Date() }
      }
    )
  }

  async delete(id) {
    if (!ObjectId.isValid(id)) return false

    const result = await this.getCollection().updateOne(
      { _id: new ObjectId(id), _deleted: false },
      {
        $set: {
          _deleted: true,
          update_at: new Date()
        }
      }
    )

    return result.modifiedCount > 0
  }
}

export default new BookRepository()
