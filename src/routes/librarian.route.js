import express from 'express'

import librarianController from '~/controllers/librarian.controller.js'

const router = express.Router()

router.get('/', librarianController.getAll)
router.get('/:id', librarianController.getDetail)
router.put('/:id', librarianController.update)
router.delete('/:id', librarianController.delete)

export default router
