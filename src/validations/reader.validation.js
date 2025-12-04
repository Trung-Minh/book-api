import Joi from 'joi'

export const createReaderSchema = Joi.object({
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

export const updateReaderSchema = createReaderSchema
  .fork(Object.keys(createReaderSchema.describe().keys), (schema) =>
    schema.optional()
  )
  .keys({
    card_status: Joi.string().valid('ACTIVE', 'LOCKED', 'EXPIRED').optional()
  })
