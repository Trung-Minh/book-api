import express from 'express'

import userController from '~/controllers/user.controller.js'

const router = express.Router()

router.post('/register', userController.register) // Tạo cho bảng users
router.post('/register-reader', userController.registerReader)
router.post('/register-staff', userController.registerStaff)
router.post('/login', userController.login)
router.delete('/:id', userController.deleteUser)

router.get('/', userController.getAll)
router.get('/:id', userController.getDetail)
router.put('/:id', userController.update)

export default router
