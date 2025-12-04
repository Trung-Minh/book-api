import Joi from 'joi'

export const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(5).max(30).required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().required().min(2).max(100),
  role: Joi.string().valid('ADMIN', 'LIBRARIAN', 'READER').default('READER'),
  status: Joi.string().valid('ACTIVE', 'LOCKED').default('ACTIVE')
})

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
})

export const registerReaderSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),

  full_name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10 digits.'
    }),

  dob: Joi.date().less('now').required(),
  address: Joi.string().required(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').default('OTHER')
})

export const updateUserSchema = Joi.object({
  full_name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9]{10}$/),
  dob: Joi.date().less('now'),
  address: Joi.string(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
  status: Joi.string().valid('ACTIVE', 'LOCKED')
})
