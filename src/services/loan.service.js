import { ObjectId } from 'mongodb'

import bookRepo from '~/repositories/book.repo.js'
import loanRepo from '~/repositories/loan.repo.js'
import userRepo from '~/repositories/user.repo.js'
import readerRepo from '~/repositories/reader.repo.js'
import bookCopyRepo from '~/repositories/bookCopy.repo.js'

class LoanService {
  // --- TẠO PHIẾU MƯỢN ---
  async createLoan(data) {
    // Lọc sách trùng lặp
    const { reader_id, staff_id, items: inputCopyIds, note } = data
    const copyIds = [...new Set(inputCopyIds)]

    // 1. Validate Độc giả & Nợ xấu
    const reader = await readerRepo.findById(reader_id)
    if (!reader) throw new Error('Reader not found')

    if (reader.card.status !== 'ACTIVE')
      throw new Error('Reader card is LOCKED or EXPIRED')

    if (reader.user_id) {
      const linkedUser = await userRepo.findById(reader.user_id)
      // Nếu tìm thấy User và status là LOCKED -> Chặn luôn
      if (linkedUser && linkedUser.status === 'LOCKED') {
        throw new Error('Linked User Account is LOCKED. Cannot borrow books.')
      }
    }

    // CHECK: Độc giả có sách quá hạn chưa trả
    const hasOverdue = await loanRepo.checkHasOverdue(reader_id)
    if (hasOverdue) {
      throw new Error('Reader has overdue books. Cannot borrow more.')
    }

    // 2. Validate Nhân viên
    const staff = await userRepo.findById(staff_id)
    if (!staff) throw new Error('Staff not found')

    const allowedRoles = ['LIBRARIAN']
    if (!allowedRoles.includes(staff.role)) {
      throw new Error('Staff ID provided is not a Librarian')
    }
    // 3. Xử lý sách & Tính hạn trả
    const loanItems = []
    const bookIdsToUpdate = new Set()
    let minAllowedDays = 9999

    for (const copyId of copyIds) {
      // Lấy bản sao
      const copy = await bookCopyRepo.findById(copyId)
      if (!copy) throw new Error(`Copy ID ${copyId} not found`)
      if (copy.status !== 'AVAILABLE')
        throw new Error(`Book ${copy.barcode} is not AVAILABLE`)

      // Lấy sách cha để xem Policy
      const book = await bookRepo.findById(copy.book_id)

      // Tính toán Policy
      const maxDays = book.lending_policy?.max_days || 14
      if (maxDays < minAllowedDays) {
        minAllowedDays = maxDays
      }

      loanItems.push({
        book_copy_id: copy._id,
        book_id: copy.book_id,
        barcode: copy.barcode,
        title: book.title,
        borrowed_at: new Date(),
        is_returned: false
      })

      bookIdsToUpdate.add(copy.book_id.toString())
    }

    // Chốt ngày hết hạn (Dựa theo cuốn có hạn ngắn nhất)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + minAllowedDays)

    // 4. Lưu dữ liệu
    const loanData = {
      reader: {
        id: reader._id,
        name: reader.full_name,
        card_number: reader.card.card_number
      },
      staff_id: new ObjectId(staff_id),
      items: loanItems,
      due_date: dueDate,
      status: 'ONGOING',
      note
    }

    const newLoan = await loanRepo.create(loanData)

    // 5. Cập nhật các bảng liên quan
    // - BookCopies: Chuyển sang BORROWED
    for (const item of loanItems) {
      await bookCopyRepo.updateStatus(
        item.book_copy_id,
        'BORROWED',
        `Borrowed via ${newLoan.loan_code}`
      )
    }

    // - Books: Trừ Available Inventory
    for (const bookIdStr of bookIdsToUpdate) {
      const count = loanItems.filter(
        (i) => i.book_id.toString() === bookIdStr
      ).length
      await bookRepo.updateInventory(bookIdStr, 0, -count)
    }

    // - Readers: Tăng số lượng đang mượn
    await readerRepo
      .getCollection()
      .updateOne(
        { _id: reader._id },
        { $inc: { 'metrics.current_loans': loanItems.length } }
      )

    return newLoan
  }

  // --- TRẢ SÁCH (Hỗ trợ trả từng phần hoặc trả hết) ---
  async returnLoan(loanId, returnDetails) {
    const loan = await loanRepo.findById(loanId)
    if (!loan) throw new Error('Loan not found')
    if (loan.status === 'RETURNED')
      throw new Error('Loan already fully returned')

    const currentItems = loan.items
    let returnedCount = 0

    for (const detail of returnDetails) {
      if (!ObjectId.isValid(detail.staff_id))
        throw new Error(`Invalid Staff ID for book ${detail.book_copy_id}`)
      const staff = await userRepo.findById(detail.staff_id)
      if (!staff) throw new Error(`Staff ID ${detail.staff_id} not found`)

      // Tìm item trong phiếu
      const itemIndex = currentItems.findIndex(
        (i) =>
          i.book_copy_id.toString() === detail.book_copy_id && !i.is_returned
      )

      if (itemIndex === -1) continue

      // Update thông tin trả
      currentItems[itemIndex].is_returned = true
      currentItems[itemIndex].returned_at = new Date()
      currentItems[itemIndex].condition_on_return = detail.condition

      // Lấy staff_id từ detail đưa vào DB
      currentItems[itemIndex].return_staff_id = new ObjectId(detail.staff_id)

      returnedCount++

      // Update kho
      const newStatus = detail.condition === 'GOOD' ? 'AVAILABLE' : 'DAMAGED'
      await bookCopyRepo.updateStatus(
        detail.book_copy_id,
        newStatus,
        'Returned'
      )

      if (detail.condition !== 'LOST') {
        const bookId = currentItems[itemIndex].book_id
        await bookRepo.updateInventory(bookId, 0, 1)
      }
    }

    const isFullyReturned = currentItems.every((i) => i.is_returned)

    // 5. Update Phiếu
    const updatedLoan = await loanRepo.updateReturnStatus(
      loanId,
      currentItems,
      isFullyReturned
    )

    if (returnedCount > 0) {
      await readerRepo
        .getCollection()
        .updateOne(
          { _id: new ObjectId(loan.reader.id) },
          { $inc: { 'metrics.current_loans': -returnedCount } }
        )
    }

    return updatedLoan
  }
}

export default new LoanService()
