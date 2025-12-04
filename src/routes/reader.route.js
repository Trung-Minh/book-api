import express from 'express'

import readerController from '~/controllers/reader.controller.js'

const router = express.Router()

router.post('/', readerController.create)
router.get('/', readerController.getAll)
router.get('/:id', readerController.getDetail)
router.put('/:id', readerController.update)
router.delete('/:id', readerController.delete)

export default router
