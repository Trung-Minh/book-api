import bookCopyService from '~/services/bookCopy.service.js'
import {
  createCopySchema,
  updateCopyStatusSchema
} from '~/validations/bookCopy.validation.js'

class BookCopyController {
  // [POST] /api/v1/book-copies/books/:bookId
  async create(req, res) {
    try {
      const { bookId } = req.params
      const { error, value } = createCopySchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      const copy = await bookCopyService.addCopy(bookId, value)
      res.status(201).json({ message: 'Copy added successfully', data: copy })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [GET] /api/v1/book-copies/books/:bookId
  async getByBook(req, res) {
    try {
      const { bookId } = req.params
      const copies = await bookCopyService.getCopiesByBook(bookId)
      res.json({ data: copies })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  // [GET] /api/v1/book-copies/:id
  async getDetail(req, res) {
    try {
      const copy = await bookCopyService.getCopyById(req.params.id)
      res.json({ data: copy })
    } catch (err) {
      const status = err.message === 'Copy not found' ? 404 : 500
      res.status(status).json({ message: err.message })
    }
  }

  // [PATCH] /api/v1/book-copies/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params
      const { error, value } = updateCopyStatusSchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      const updatedCopy = await bookCopyService.updateCopyStatus(
        id,
        value.status,
        value.note
      )
      res.json({ message: 'Status updated', data: updatedCopy })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [DELETE] /api/v1/book-copies/:id
  async delete(req, res) {
    try {
      await bookCopyService.deleteCopy(req.params.id)
      res.json({ message: 'Copy deleted successfully' })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

export default new BookCopyController()
