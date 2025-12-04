import dotenv from 'dotenv'

import { MongoClient } from 'mongodb'

dotenv.config()

const uri = process.env.MONGODB_URI
const dbName = process.env.DATABASE_NAME

const client = new MongoClient(uri, {
  minPoolSize: 10,
  maxPoolSize: 100
})

let dbInstance = null

export async function connectDB() {
  try {
    await client.connect()
    dbInstance = client.db(dbName)
    console.log('Connected successfully to MongoDB')
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}

export function getDB() {
  if (!dbInstance) {
    throw new Error('Call connectDB first!')
  }
  return dbInstance
}

export function closeDB() {
  return client.close()
}
