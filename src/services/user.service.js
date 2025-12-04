import bcrypt from 'bcryptjs'

import readerService from './reader.service.js'

import userRepo from '~/repositories/user.repo.js'
import readerRepo from '~/repositories/reader.repo.js'
import librarianRepo from '~/repositories/librarian.repo.js'

class UserService {
  async register(data) {
    // Check trùng username
    const existingUser = await userRepo.findByUsername(data.username)
    if (existingUser) {
      throw new Error('Username already exists')
    }

    // Mã hóa password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(data.password, salt)

    const userToCreate = {
      username: data.username,
      password_hash: hashedPassword,
      full_name: data.full_name,
      role: data.role,
      status: data.status || 'ACTIVE'
    }

    return await userRepo.create(userToCreate)
  }

  async registerReader(fullData) {
    const existingReader = await readerRepo.findByEmail(fullData.email)

    // === TRƯỜNG HỢP 1: Đã có hồ sơ Độc giả (Restore) ===
    if (existingReader) {
      // Nếu hồ sơ đang hoạt động -> Báo lỗi trùng
      if (existingReader._deleted === false) {
        throw new Error('Email already exists in Reader system')
      }

      // A. Khôi phục User (dựa vào user_id lưu trong Reader cũ)
      // Cần hash password mới mà người dùng vừa nhập
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(fullData.password, salt)

      const userRestoreData = {
        username: fullData.username,
        password_hash: hashedPassword,
        full_name: fullData.full_name,
        status: 'ACTIVE'
      }

      const restoredUser = await userRepo.restore(
        existingReader.user_id,
        userRestoreData
      )

      if (!restoredUser) {
        throw new Error('Old User account not found to restore')
      }

      // B. Khôi phục Reader
      const readerData = {
        full_name: fullData.full_name,
        email: fullData.email,
        phone: fullData.phone,
        dob: fullData.dob,
        address: fullData.address,
        gender: fullData.gender
      }

      const restoredReader = await readerService.createReader(
        readerData,
        restoredUser._id
      )

      return { account: restoredUser, profile: restoredReader }
    }

    // === TRƯỜNG HỢP 2: Chưa có hồ sơ ===

    // A. Tạo User mới
    const userData = {
      username: fullData.username,
      password: fullData.password,
      full_name: fullData.full_name,
      email: fullData.email,
      phone: fullData.phone,
      role: 'READER',
      status: 'ACTIVE'
    }

    // Hàm này sẽ throw lỗi nếu Username bị trùng với ai đó khác
    const newUser = await this.register(userData)

    try {
      // B. Tạo Reader Profile
      const readerData = {
        full_name: fullData.full_name,
        email: fullData.email,
        phone: fullData.phone,
        dob: fullData.dob,
        address: fullData.address,
        gender: fullData.gender
      }

      const newReader = await readerService.createReader(
        readerData,
        newUser._id
      )

      return { account: newUser, profile: newReader }
    } catch (error) {
      await userRepo.deleteForce(newUser._id)
      throw error
    }
  }

  async registerStaff(fullData) {
    const userData = {
      username: fullData.username,
      password: fullData.password,
      full_name: fullData.full_name,
      email: fullData.email,
      phone: fullData.phone,
      role: 'LIBRARIAN',
      status: 'ACTIVE'
    }

    // Hàm register cũ đã có logic check trùng username/email
    const newUser = await this.register(userData)

    try {
      const employeeCode = await librarianRepo.generateEmployeeCode()

      const staffData = {
        user_id: newUser._id,
        employee_code: employeeCode,
        full_name: fullData.full_name,
        phone: fullData.phone,
        dob: fullData.dob,
        address: fullData.address,
        position: fullData.position,
        start_date: fullData.start_date
      }

      const newLibrarian = await librarianRepo.create(staffData)

      return { account: newUser, profile: newLibrarian }
    } catch (error) {
      await userRepo.deleteForce(newUser._id)
      throw error
    }
  }

  async login(username, password) {
    const user = await userRepo.findByUsername(username)
    if (!user) {
      throw new Error('Invalid username or password')
    }

    // Check xem tài khoản có bị khóa không?
    if (user.status === 'LOCKED') {
      throw new Error('Account is locked')
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      throw new Error('Invalid username or password')
    }

    const { password_hash, _deleted, ...userInfo } = user
    return userInfo
  }

  async getUsers({ page = 1, limit = 10, search, role }) {
    const filter = {}
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { full_name: { $regex: search, $options: 'i' } }
      ]
    }
    if (role) filter.role = role

    const sort = { created_at: -1 }
    return await userRepo.findAll({ filter, page, limit, sort })
  }

  async getUserById(id) {
    const user = await userRepo.findById(id)
    if (!user) throw new Error('User not found')
    return user
  }

  async updateUser(id, data) {
    const { username, password, role, ...updateData } = data

    const updatedUser = await userRepo.update(id, updateData)
    if (!updatedUser) throw new Error('User not found')
    return updatedUser
  }

  async deleteUser(id) {
    const isDeleted = await userRepo.delete(id)
    if (!isDeleted) {
      throw new Error('User not found or already deleted')
    }

    await Promise.all([
      readerRepo.deleteByUserId(id),
      librarianRepo.deleteByUserId(id)
    ])

    return true
  }
}

export default new UserService()
