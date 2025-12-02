import express from 'express'
import bookCopyController from '~/controllers/bookCopy.controller.js'

const router = express.Router()

router.post('/books/:bookId', bookCopyController.create)
router.get('/books/:bookId', bookCopyController.getByBook)
router.get('/:id', bookCopyController.getDetail)
router.patch('/:id/status', bookCopyController.updateStatus)
router.delete('/:id', bookCopyController.delete)

export default router
