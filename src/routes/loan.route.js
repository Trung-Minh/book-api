import express from 'express'

import loanController from '~/controllers/loan.controller.js'

const router = express.Router()

router.post('/', loanController.create)
router.post('/:id/return', loanController.returnLoan)

export default router
