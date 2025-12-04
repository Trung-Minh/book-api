import librarianService from '~/services/librarian.service.js'
import { updateStaffSchema } from '~/validations/staff.validation.js'

class LibrarianController {
  // [GET] /
  async getAll(req, res) {
    try {
      const { page, limit, search } = req.query
      const result = await librarianService.getLibrarians({
        page,
        limit,
        search
      })
      res.json(result)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  // [GET] /:id
  async getDetail(req, res) {
    try {
      const result = await librarianService.getDetail(req.params.id)
      res.json({ data: result })
    } catch (err) {
      res.status(404).json({ message: err.message })
    }
  }

  // [PUT] /:id
  async update(req, res) {
    try {
      const { error, value } = updateStaffSchema.validate(req.body)

      if (error) {
        return res.status(400).json({ message: error.details[0].message })
      }

      const result = await librarianService.updateProfile(req.params.id, value)

      res.json({ message: 'Profile updated', data: result })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // [DELETE] /:id
  async delete(req, res) {
    try {
      await librarianService.deleteLibrarian(req.params.id)
      res.json({ message: 'Staff deleted successfully (Account and Profile)' })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

export default new LibrarianController()
