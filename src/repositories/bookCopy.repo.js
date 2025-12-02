import { getDB } from '~/config/db.js'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'book_copies'

class BookCopyRepository {
  getCollection() {
    return getDB().collection(COLLECTION_NAME)
  }

  async create(copyData) {
    const doc = {
      ...copyData,
      book_id: new ObjectId(copyData.book_id),
      imported_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      _deleted: false
    }
    const result = await this.getCollection().insertOne(doc)

    const { _deleted, ...ret } = doc
    return { _id: result.insertedId, ...ret }
  }

  // Tìm tất cả bản sao của 1 cuốn sách (trừ bản đã xóa)
  async findByBookId(bookId) {
    return await this.getCollection()
      .find({ book_id: new ObjectId(bookId), _deleted: false })
      .project({ _deleted: 0 })
      .toArray()
  }

  // Tìm bản sao để check trùng barcode
  async findAnyByBarcode(barcode) {
    return await this.getCollection().findOne({ barcode })
  }

  // Tìm chi tiết 1 bản sao
  async findById(id) {
    if (!ObjectId.isValid(id)) return null
    return await this.getCollection().findOne(
      { _id: new ObjectId(id), _deleted: false },
      { projection: { _deleted: 0 } }
    )
  }

  // Khôi phục bản sao đã xóa
  async restore(id, newData) {
    return await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...newData,
          book_id: new ObjectId(newData.book_id),
          _deleted: false,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after', projection: { _deleted: 0 } }
    )
  }

  // Cập nhật trạng thái (Hỏng, Mất...)
  async updateStatus(id, status, note) {
    return await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id), _deleted: false },
      {
        $set: { status, note, updated_at: new Date() }
      },
      { returnDocument: 'after', projection: { _deleted: 0 } }
    )
  }

  async delete(id) {
    if (!ObjectId.isValid(id)) return false

    const result = await this.getCollection().updateOne(
      { _id: new ObjectId(id), _deleted: false },
      {
        $set: { _deleted: true, updated_at: new Date() }
      }
    )
    return result.modifiedCount > 0
  }
}

export default new BookCopyRepository()
