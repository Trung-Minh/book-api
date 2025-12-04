import readerService from '~/services/reader.service.js'

import {
  createReaderSchema,
  updateReaderSchema
} from '~/validations/reader.validation.js'

class ReaderController {
  // [POST] /
  async create(req, res) {
    try {
      const { error, value } = createReaderSchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      const newReader = await readerService.createReader(value)
      res
        .status(201)
        .json({ message: 'Reader registered successfully', data: newReader })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [GET] /
  async getAll(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await readerService.getReaders({ page, limit, search })
      res.json(result)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  // [GET] /:id
  async getDetail(req, res) {
    try {
      const reader = await readerService.getReaderById(req.params.id)
      res.json({ data: reader })
    } catch (err) {
      const status = err.message === 'Reader not found' ? 404 : 500
      res.status(status).json({ message: err.message })
    }
  }

  // [PUT] /:id
  async update(req, res) {
    try {
      const { error, value } = updateReaderSchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      const updatedReader = await readerService.updateReader(
        req.params.id,
        value
      )
      res.json({ message: 'Reader updated', data: updatedReader })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [DELETE] /:id
  async delete(req, res) {
    try {
      await readerService.deleteReader(req.params.id)
      res.json({ message: 'Reader deleted successfully' })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

export default new ReaderController()
