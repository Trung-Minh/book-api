import userService from './user.service.js'

import librarianRepo from '~/repositories/librarian.repo.js'
import userRepo from '~/repositories/user.repo.js'

class LibrarianService {
  // Lấy danh sách (Có thể search theo mã NV hoặc tên)
  async getLibrarians({ page = 1, limit = 10, search }) {
    const filter = {}
    if (search) {
      filter.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { employee_code: { $regex: search, $options: 'i' } }
      ]
    }

    const sort = { created_at: -1 }
    const result = await librarianRepo.findAll({ filter, page, limit, sort })

    return {
      data: result.librarians,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(result.total / limit),
        total_items: result.total
      }
    }
  }

  // Xem chi tiết
  async getDetail(id) {
    const profile = await librarianRepo.findById(id)
    if (!profile) throw new Error('Librarian profile not found')

    // Lấy thêm thông tin Account
    const account = await userRepo.findById(profile.user_id)

    return {
      ...profile,
      account_info: account
        ? {
            username: account.username,
            email: account.email,
            status: account.status,
            role: account.role
          }
        : null
    }
  }

  // Cập nhật Profile
  async updateProfile(id, data) {
    // Không cho phép sửa mã nhân viên (employee_code) hoặc user_id
    const { employee_code, user_id, ...updateData } = data

    const updatedProfile = await librarianRepo.update(id, updateData)
    if (!updatedProfile) throw new Error('Librarian profile not found')

    return updatedProfile
  }

  async deleteLibrarian(id) {
    const profile = await librarianRepo.findById(id)
    if (!profile) throw new Error('Librarian profile not found')

    await userService.deleteUser(profile.user_id)

    return true
  }
}

export default new LibrarianService()
