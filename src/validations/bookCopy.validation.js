import Joi from 'joi'

export const createCopySchema = Joi.object({
  barcode: Joi.string().required().min(5).max(50),
  location: Joi.string().required(),
  status: Joi.string()
    .valid('AVAILABLE', 'BORROWED', 'LOST', 'DAMAGED')
    .default('AVAILABLE'),
  note: Joi.string().allow('', null)
})

export const updateCopyStatusSchema = Joi.object({
  status: Joi.string()
    .valid('AVAILABLE', 'BORROWED', 'LOST', 'DAMAGED')
    .required(),
  note: Joi.string().allow('', null)
})
