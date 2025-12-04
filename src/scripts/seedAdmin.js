import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

import { MongoClient } from 'mongodb'

dotenv.config()

const uri = process.env.MONGODB_URI
const dbName = process.env.DATABASE_NAME

async function seedAdmin() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(dbName)
    const usersCol = db.collection('users')

    // Kiểm tra xem đã có Admin chưa
    const existingAdmin = await usersCol.findOne({ role: 'ADMIN' })
    if (existingAdmin) {
      console.log('Admin account already exists.')
      return
    }

    // Tạo Admin mới
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('admin123', salt)

    const adminData = {
      username: 'admin',
      password_hash: hashedPassword,
      full_name: 'System Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
      _deleted: false
    }

    await usersCol.insertOne(adminData)
    console.log('Admin account created successfully!')
  } catch (error) {
    console.error('Seeding failed:', error)
  } finally {
    await client.close()
  }
}

seedAdmin()
