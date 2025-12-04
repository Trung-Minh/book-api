import express from 'express'

import bookController from '~/controllers/book.controller.js'

const router = express.Router()

// Routes
router.post('/', bookController.create)
router.get('/', bookController.getAll)
router.get('/:id', bookController.getDetail)
router.put('/:id', bookController.update)
router.delete('/:id', bookController.delete)

export default router
