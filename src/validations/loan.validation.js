import Joi from 'joi'

export const createLoanSchema = Joi.object({
  reader_id: Joi.string().required(),
  staff_id: Joi.string().required(),
  items: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .unique()
    .required()
    .messages({
      'array.min': 'Must borrow at least one book'
    }),
  note: Joi.string().allow('', null)
})

export const returnLoanSchema = Joi.object({
  return_details: Joi.array()
    .items(
      Joi.object({
        book_copy_id: Joi.string().required(),
        condition: Joi.string()
          .valid('GOOD', 'DAMAGED', 'LOST')
          .default('GOOD'),
        staff_id: Joi.string().required(),
        penalty_amount: Joi.number().min(0).default(0)
      })
    )
    .min(1)
    .required()
})
