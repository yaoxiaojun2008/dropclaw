import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Test database connection
    await pool.query('SELECT 1')

    const result = await pool.query(
      'SELECT * FROM user_registered WHERE username = $1 AND password = $2',
      [username, password]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, user: result.rows[0] })
  } catch (error: any) {
    console.error('Login error:', error)

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
      { error: `Login failed: ${error.message}` },
      { status: 500 }
    )
  }
}
