import { ObjectId } from 'mongodb'

import { getDB } from '~/config/db.js'

const COLLECTION_NAME = 'librarians'

class LibrarianRepository {
  getCollection() {
    return getDB().collection(COLLECTION_NAME)
  }

  async create(data) {
    const doc = {
      user_id: new ObjectId(data.user_id),
      employee_code: data.employee_code, // Mã nhân viên (VD: NV2025001)
      full_name: data.full_name,
      phone: data.phone,
      dob: data.dob,
      address: data.address,
      position: data.position,
      start_date: data.start_date,

      created_at: new Date(),
      updated_at: new Date(),
      _deleted: false
    }
    const result = await this.getCollection().insertOne(doc)
    const { _deleted, ...ret } = doc

    return { _id: result.insertedId, ...ret }
  }

  async findByUserId(userId) {
    return await this.getCollection().findOne({
      user_id: new ObjectId(userId),
      _deleted: false
    })
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

    const librarians = await cursor.toArray()
    const total = await this.getCollection().countDocuments(query)

    return { librarians, total }
  }

  async update(id, updateData) {
    if (!ObjectId.isValid(id)) return null
    return await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id), _deleted: false },
      { $set: { ...updateData, updated_at: new Date() } },
      { returnDocument: 'after', projection: { _deleted: 0 } }
    )
  }

  // Hàm tạo mã nhân viên tự động (NV + timestamp hoặc random)
  async generateEmployeeCode() {
    const count = await this.getCollection().countDocuments()
    const code = `NV${new Date().getFullYear()}${(count + 1).toString().padStart(3, '0')}`
    return code
  }

  // Xóa theo User ID (Cascade Delete)
  async deleteByUserId(userId) {
    if (!ObjectId.isValid(userId)) return false

    return await this.getCollection().updateOne(
      { user_id: new ObjectId(userId), _deleted: false },
      { $set: { _deleted: true, updated_at: new Date() } }
    )
  }
}

export default new LibrarianRepository()
