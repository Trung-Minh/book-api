import Joi from 'joi'

export const createBookSchema = Joi.object({
  title: Joi.string().required().min(3).max(255),
  isbn: Joi.string().required().length(14),
  publication_year: Joi.number()
    .integer()
    .min(1000)
    .max(new Date().getFullYear()),
  publisher: Joi.string().required(),
  description: Joi.string().allow('', null),
  authors: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        id: Joi.alternatives().try(Joi.string(), Joi.number()).optional()
      })
    )
    .min(1)
    .required(),
  category: Joi.object({
    code: Joi.string().required(),
    name: Joi.string().required()
  }).required(),
  lending_policy: Joi.object({
    max_days: Joi.number().integer().min(1).default(14),
    max_renewals: Joi.number().integer().default(1),
    allow_home_loan: Joi.boolean().default(true)
  }).default(),
  keywords: Joi.array().items(Joi.string()).default([])
})

export const updateBookSchema = createBookSchema.fork(
  Object.keys(createBookSchema.describe().keys),
  (schema) => schema.optional()
)
