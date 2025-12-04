import userService from '~/services/user.service.js'

import {
  createUserSchema,
  loginSchema,
  registerReaderSchema,
  updateUserSchema
} from '~/validations/user.validation.js'
import { createStaffSchema } from '~/validations/staff.validation.js'

class UserController {
  // [POST] /register
  async register(req, res) {
    try {
      const { error, value } = createUserSchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      const user = await userService.register(value)
      res
        .status(201)
        .json({ message: 'User registered successfully', data: user })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [POST] /register-reader
  async registerReader(req, res) {
    try {
      const { error, value } = registerReaderSchema.validate(req.body)

      if (error) {
        return res.status(400).json({ message: error.details[0].message })
      }

      const result = await userService.registerReader(value)

      res
        .status(201)
        .json({ message: 'Reader registered successfully', data: result })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [POST] /register-staff (Chỉ Admin mới được gọi)
  async registerStaff(req, res) {
    try {
      const { error, value } = createStaffSchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      const result = await userService.registerStaff(value)
      res
        .status(201)
        .json({ message: 'Staff created successfully', data: result })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [POST] /login
  async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      const user = await userService.login(value.username, value.password)
      res.json({ message: 'Login successful', data: user })
    } catch (err) {
      res.status(401).json({ message: err.message })
    }
  }

  // [GET] /api/v1/users
  async getAll(req, res) {
    try {
      const { page, limit, search, role } = req.query
      const result = await userService.getUsers({
        page,
        limit,
        search,
        role
      })
      res.json(result)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  // [GET] /api/v1/users/:id
  async getDetail(req, res) {
    try {
      const user = await userService.getUserById(req.params.id)
      res.json({ data: user })
    } catch (err) {
      const status = err.message === 'User not found' ? 404 : 500
      res.status(status).json({ message: err.message })
    }
  }

  // [PUT] /api/v1/users/:id
  async update(req, res) {
    try {
      const { error, value } = updateUserSchema.validate(req.body)

      if (error) {
        return res.status(400).json({ message: error.details[0].message })
      }

      const user = await userService.updateUser(req.params.id, value)
      res.json({ message: 'User updated', data: user })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [DELETE] /api/v1/users/:id
  async deleteUser(req, res) {
    try {
      const { id } = req.params
      await userService.deleteUser(id)
      res.json({ message: 'User deleted successfully' })
    } catch (err) {
      const status = err.message.includes('not found') ? 404 : 400
      res.status(status).json({ message: err.message })
    }
  }
}

export default new UserController()
