import loanService from '~/services/loan.service.js'

import {
  createLoanSchema,
  returnLoanSchema
} from '../validations/loan.validation.js'

class LoanController {
  async create(req, res) {
    try {
      const { error, value } = createLoanSchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      const loan = await loanService.createLoan(value)
      res.status(201).json({ message: 'Loan created successfully', data: loan })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async returnLoan(req, res) {
    try {
      const { error, value } = returnLoanSchema.validate(req.body)
      if (error)
        return res.status(400).json({ message: error.details[0].message })

      // Value.return_details là mảng các sách cần trả
      const result = await loanService.returnLoan(
        req.params.id,
        value.return_details
      )
      res.json({ message: 'Books returned successfully', data: result })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

export default new LoanController()
