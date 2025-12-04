import bookService from '~/services/book.service.js'

import {
  createBookSchema,
  updateBookSchema
} from '~/validations/book.validation.js'

class BookController {
  // [POST] /
  async create(req, res) {
    try {
      const { error, value } = createBookSchema.validate(req.body)
      if (error) {
        return res.status(400).json({ message: error.details[0].message })
      }

      const newBook = await bookService.createBook(value)
      res
        .status(201)
        .json({ message: 'Book created successfully', data: newBook })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [GET] /
  async getAll(req, res) {
    try {
      const { page, limit, search, category } = req.query
      const result = await bookService.getBooks({
        page,
        limit,
        search,
        category
      })
      res.json(result)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  // [GET] /:id
  async getDetail(req, res) {
    try {
      const book = await bookService.getBookById(req.params.id)
      res.json({ data: book })
    } catch (err) {
      const status = err.message === 'Book not found' ? 404 : 500
      res.status(status).json({ message: err.message })
    }
  }

  // [PUT] /:id
  async update(req, res) {
    try {
      const { error, value } = updateBookSchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      const updatedBook = await bookService.updateBook(req.params.id, value)
      res.json({ message: 'Book updated', data: updatedBook })
    } catch (err) {
      const status = err.message.includes('not found') ? 404 : 500
      res.status(status).json({ message: err.message })
    }
  }

  // [DELETE] /:id
  async delete(req, res) {
    try {
      await bookService.deleteBook(req.params.id)
      res.json({ message: 'Book deleted successfully' })
    } catch (err) {
      res.status(404).json({ message: err.message })
    }
  }
}

export default new BookController()
