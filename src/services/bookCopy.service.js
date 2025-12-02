import bookCopyRepo from '~/repositories/bookCopy.repo.js'
import bookRepo from '~/repositories/book.repo.js'

class BookCopyService {
  async addCopy(bookId, data) {
    const book = await bookRepo.findById(bookId)
    if (!book) throw new Error('Book not found')

    const existingCopy = await bookCopyRepo.findAnyByBarcode(data.barcode)

    let newCopy = null

    if (existingCopy) {
      if (existingCopy._deleted === false) {
        throw new Error(`Barcode ${data.barcode} already exists`)
      }

      newCopy = await bookCopyRepo.restore(existingCopy._id, {
        ...data,
        book_id: bookId
      })
    } else {
      newCopy = await bookCopyRepo.create({ ...data, book_id: bookId })
    }

    // CẬP NHẬT KHO SÁCH (INVENTORY)
    const isAvailable = newCopy.status === 'AVAILABLE'
    await bookRepo.updateInventory(bookId, 1, isAvailable ? 1 : 0)

    return newCopy
  }

  // Lấy danh sách bản sao theo sách
  async getCopiesByBook(bookId) {
    return await bookCopyRepo.findByBookId(bookId)
  }

  // Lấy một bản sao
  async getCopyById(id) {
    const copy = await bookCopyRepo.findById(id)
    if (!copy) throw new Error('Copy not found')
    return copy
  }

  // Cập nhật trạng thái
  async updateCopyStatus(copyId, status, note) {
    const currentCopy = await bookCopyRepo.findById(copyId)
    if (!currentCopy) throw new Error('Copy not found')

    if (currentCopy.status === status) {
      return currentCopy
    }

    // Tính toán thay đổi cho Inventory
    // Nếu cũ là AVAILABLE mà mới KHÔNG PHẢI -> Available GIẢM 1
    // Nếu cũ KHÔNG PHẢI Available mà mới LÀ AVAILABLE -> Available TĂNG 1
    let availableChange = 0
    if (currentCopy.status === 'AVAILABLE' && status !== 'AVAILABLE') {
      availableChange = -1
    } else if (currentCopy.status !== 'AVAILABLE' && status === 'AVAILABLE') {
      availableChange = 1
    }

    const updatedCopy = await bookCopyRepo.updateStatus(copyId, status, note)

    if (availableChange !== 0) {
      await bookRepo.updateInventory(currentCopy.book_id, 0, availableChange)
    }

    return updatedCopy
  }

  // Xóa bản sao
  async deleteCopy(copyId) {
    const currentCopy = await bookCopyRepo.findById(copyId)
    if (!currentCopy) throw new Error('Copy not found')

    const isDeleted = await bookCopyRepo.delete(copyId)
    if (!isDeleted) throw new Error('Delete failed')

    // Cập nhật kho
    const availableChange = currentCopy.status === 'AVAILABLE' ? -1 : 0
    await bookRepo.updateInventory(currentCopy.book_id, -1, availableChange)

    return true
  }
}

export default new BookCopyService()
