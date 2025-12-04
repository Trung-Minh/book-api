import { ObjectId } from 'mongodb'

import { getDB } from '~/config/db.js'

const COLLECTION_NAME = 'loans'

class LoanRepository {
  getCollection() {
    return getDB().collection(COLLECTION_NAME)
  }

  async create(loanData) {
    const doc = {
      ...loanData,
      loan_code: `PM${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date(),
      _deleted: false
    }
    const result = await this.getCollection().insertOne(doc)
    const { _deleted, ...ret } = doc

    return { _id: result.insertedId, ...ret }
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

  // Tìm các phiếu đang mượn của độc giả
  async findActiveLoansByReader(readerId) {
    return await this.getCollection()
      .find({
        'reader.id': new ObjectId(readerId),
        status: 'ONGOING',
        _deleted: false
      })
      .project({ _deleted: 0 })
      .toArray()
  }

  // Kiểm tra độc giả có đang giữ sách quá hạn không ---
  async checkHasOverdue(readerId) {
    const now = new Date()
    const overdueLoan = await this.getCollection().findOne({
      'reader.id': new ObjectId(readerId),
      status: 'ONGOING',
      due_date: { $lt: now },
      _deleted: false
    })
    return !!overdueLoan
  }

  // Cập nhật trạng thái phiếu khi trả
  async updateReturnStatus(id, returnedItems, isFullyReturned) {
    const updateData = {
      updated_at: new Date(),
      items: returnedItems
    }

    // Nếu trả đủ hết sách thì đóng phiếu
    if (isFullyReturned) {
      updateData.status = 'RETURNED'
      updateData.returned_at = new Date()
    }

    return await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after', projection: { _deleted: 0 } }
    )
  }
}

export default new LoanRepository()
