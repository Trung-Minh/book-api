import { ObjectId } from 'mongodb'

import readerRepo from '~/repositories/reader.repo.js'

class ReaderService {
  // Hàm helper sinh mã thẻ
  generateCard() {
    const today = new Date()
    const year = today.getFullYear().toString().slice(-2)
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const random = Math.floor(1000 + Math.random() * 9000)

    // Hạn thẻ 1 năm
    const expiryDate = new Date(today)
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)

    return {
      card_number: `DG${year}${month}${random}`,
      issue_date: today,
      expiry_date: expiryDate,
      status: 'ACTIVE',
      type: 'STUDENT'
    }
  }

  async generateUniqueCard() {
    let isUnique = false
    let cardInfo = null

    while (!isUnique) {
      cardInfo = this.generateCard()

      // Kiểm tra trong DB xem mã này có chưa
      const existing = await readerRepo.findAnyByCardNumber(
        cardInfo.card_number
      )

      if (!existing) {
        isUnique = true
      }
    }

    return cardInfo
  }

  async createReader(data, userId = null) {
    // 1. Check trùng Email
    const existingReader = await readerRepo.findByEmail(data.email)

    const cardInfo = await this.generateUniqueCard()
    const fullData = {
      ...data,
      card: cardInfo,
      user_id: userId ? new ObjectId(userId) : null
    }

    if (existingReader) {
      if (existingReader._deleted === false) {
        throw new Error('Email already exists')
      }
      // Nếu đã xóa -> Khôi phục + Cấp thẻ mới
      return await readerRepo.restore(existingReader._id, fullData)
    }

    return await readerRepo.create(fullData)
  }

  async getReaders({ page = 1, limit = 10, search }) {
    const filter = {}
    if (search) {
      filter.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'card.card_number': { $regex: search, $options: 'i' } }
      ]
    }

    const sort = { created_at: -1 }

    const { readers, total } = await readerRepo.findAll({
      filter,
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    })

    return {
      data: readers,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total
      }
    }
  }

  async getReaderById(id) {
    const reader = await readerRepo.findById(id)
    if (!reader) throw new Error('Reader not found')
    return reader
  }

  async updateReader(id, data) {
    const updateData = { ...data }

    if (updateData.card_status) {
      updateData['card.status'] = updateData.card_status
      delete updateData.card_status
    }

    const updatedReader = await readerRepo.update(id, updateData)
    if (!updatedReader) throw new Error('Reader not found')
    return updatedReader
  }

  async deleteReader(id) {
    const isDeleted = await readerRepo.delete(id)
    if (!isDeleted) throw new Error('Reader not found')
    return true
  }
}

export default new ReaderService()
