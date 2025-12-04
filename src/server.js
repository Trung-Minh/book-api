import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import bookRoutes from './routes/book.route.js'
import loanRoutes from './routes/loan.route.js'
import userRoutes from './routes/user.route.js'
import readerRoutes from './routes/reader.route.js'
import bookCopyRoutes from './routes/bookCopy.route.js'
import librarianRoutes from './routes/librarian.route.js'

import { connectDB, closeDB } from './config/db.js'

dotenv.config()

const app = express()
const PORT = process.env.APP_PORT || 3000

// 1. Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// 2. Routes
app.use('/api/v1/books', bookRoutes)
app.use('/api/v1/loans', loanRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/readers', readerRoutes)
app.use('/api/v1/book-copies', bookCopyRoutes)
app.use('/api/v1/librarians', librarianRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Server is running...' })
})

// 3. Error Handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  })
})

// 4. Start Server
const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// 5. Shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...')
  await closeDB()
  process.exit(0)
})

export default app
