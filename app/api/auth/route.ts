import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(request: Request) {
  try {
    const { username, password, email } = await request.json()

    // Validate required fields
    if (!username || !password || !email) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Test database connection
    await pool.query('SELECT 1')

    // Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM user_registered WHERE username = $1',
      [username]
    )

    if (userExists.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if email exists
    const emailExists = await pool.query(
      'SELECT * FROM user_registered WHERE email = $1',
      [email]
    )

    if (emailExists.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create new user
    await pool.query(
      `INSERT INTO user_registered (username, password, email, reset_token)
       VALUES ($1, $2, $3, '')`,
      [username, password, email]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Registration error:', error)

    // Provide more specific error messages
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your DATABASE_URL configuration.' },
        { status: 500 }
      )
    }

    if (error.code === '42P01') {
      return NextResponse.json(
        { error: 'Table user_registered does not exist. Please create the table first.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: `Registration failed: ${error.message}` },
      { status: 500 }
    )
  }
}
