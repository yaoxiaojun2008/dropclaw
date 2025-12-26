const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('📍 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.log('Please configure your DATABASE_URL in .env.local');
    return;
  }

  // Parse and display connection details
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('🔗 Connection Details:');
    console.log(`  👤 Username: ${url.username}`);
    console.log(`  🏠 Hostname: ${url.hostname}`);
    console.log(`  📊 Database: ${url.pathname.slice(1)}`); // Remove leading slash
    console.log(`  🔒 SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`);
    console.log(`  🔗 Full URL: ${url.href.replace(url.password, '***')}`); // Hide password
  } catch (error) {
    console.log('⚠️  Could not parse DATABASE_URL format');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('⏳ Attempting to connect to database...');

    // Test basic connection
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ Basic connection successful!');
    console.log('📊 Test query result:', result.rows[0]);

    // Test if table exists
    console.log('⏳ Checking if user_registered table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_registered'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ user_registered table exists!');

      // Check table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_registered'
        ORDER BY ordinal_position;
      `);

      console.log('📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });

      // Check if there are any existing users
      const userCount = await pool.query('SELECT COUNT(*) as count FROM user_registered');
      console.log(`👥 Existing users: ${userCount.rows[0].count}`);

    } else {
      console.log('❌ user_registered table does not exist!');
      console.log('📄 Please run the SQL in create_table.sql to create the table');
    }

    console.log('🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error details:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - check your DATABASE_URL and network connectivity');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Host not found - check your DATABASE_URL hostname');
    } else if (error.code === '28P01') {
      console.log('💡 Authentication failed - check username/password in DATABASE_URL');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist - check database name in DATABASE_URL');
    }

  } finally {
    await pool.end();
    console.log('🔌 Database connection closed.');
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
