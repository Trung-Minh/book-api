import express from 'express'
import { connectDB, closeDB } from './config/db.js'
import bookRoutes from './routes/book.route.js'
import bookCopyRoutes from './routes/bookCopy.route.js'
import dotenv from 'dotenv'
import cors from 'cors'

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
app.use('/api/v1/book-copies', bookCopyRoutes)

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
