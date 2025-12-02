import bookRepo from '~/repositories/book.repo.js'

class BookService {
  async createBook(data) {
    const existingBook = await bookRepo.findAnyByISBN(data.isbn)

    if (existingBook) {
      if (existingBook._deleted === false) {
        throw new Error('Book with this ISBN already exists')
      }

      // TRƯỜNG HỢP: Sách tồn tại nhưng ĐÃ XÓA (_deleted: true)
      return await bookRepo.restore(existingBook._id, data)
    }

    return await bookRepo.create(data)
  }

  async getBooks({ page = 1, limit = 10, search, category }) {
    const filter = {}

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'authors.name': { $regex: search, $options: 'i' } }
      ]
    }

    // Logic lọc theo danh mục
    if (category) {
      filter['category.code'] = category
    }

    const sort = { created_at: -1 }

    const { books, total } = await bookRepo.findAll({
      filter,
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    })

    return {
      data: books,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total
      }
    }
  }

  async getBookById(id) {
    const book = await bookRepo.findById(id)
    if (!book) throw new Error('Book not found')
    return book
  }

  async updateBook(id, data) {
    const updatedBook = await bookRepo.update(id, data)
    if (!updatedBook) throw new Error('Book not found or update failed')
    return updatedBook
  }

  async deleteBook(id) {
    const isDeleted = await bookRepo.delete(id)
    if (!isDeleted) throw new Error('Book not found')
    return true
  }
}

module.exports = new BookService()
