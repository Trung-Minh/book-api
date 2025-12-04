import Joi from 'joi'

export const createStaffSchema = Joi.object({
  // Phần Account
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),

  // Phần Profile Nhân viên
  full_name: Joi.string().required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  dob: Joi.date().less('now').optional(),
  address: Joi.string().optional(),

  // Thông tin nghiệp vụ
  position: Joi.string().default('LIBRARIAN'), // Thủ thư, Quản lý kho...
  start_date: Joi.date().default(new Date()),
  salary_tier: Joi.number().optional()
})

export const updateStaffSchema = Joi.object({
  full_name: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  dob: Joi.date().less('now'),
  address: Joi.string(),
  position: Joi.string(),
  start_date: Joi.date(), // Update ngày vào làm nếu nhập sai
  salary_tier: Joi.number()
})
