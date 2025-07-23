require('dotenv').config(); // Load .env file
const mysql = require('mysql2/promise');

// Create pool (not single connection)
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // Example: containers-us-west-xx.railway.app
  user: process.env.DB_USER,         // Usually "root"
  password: process.env.DB_PASSWORD, // Your password from Railway
  database: process.env.DB_NAME,     // collegedb
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0
});

// Query utility
async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log("Initializing database...");

    await query(`
      CREATE TABLE IF NOT EXISTS admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        department VARCHAR(255),
        year VARCHAR(50),
        mobile VARCHAR(20),
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS students (
        rollno VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        department VARCHAR(255),
        year VARCHAR(50),
        class VARCHAR(50),
        email VARCHAR(255) UNIQUE,
        semester VARCHAR(50),
        whatsapp VARCHAR(20),
        language VARCHAR(50)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS advisors (
        advisorid VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        department VARCHAR(255),
        year VARCHAR(50),
        class VARCHAR(50),
        semester VARCHAR(50),
        username VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        mobile VARCHAR(20)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS subjects (
        subject_code VARCHAR(50),
        subject_name VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        year VARCHAR(50),
        semester VARCHAR(50),
        PRIMARY KEY (subject_code, department)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        path VARCHAR(512),
        uploaded_by VARCHAR(255),
        upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS student_marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_rollno VARCHAR(50),
        student_name VARCHAR(255),
        exam_type VARCHAR(50) NOT NULL,
        subject_code VARCHAR(50),
        marks TEXT,
        FOREIGN KEY (student_rollno) REFERENCES students(rollno) ON DELETE CASCADE,
        UNIQUE (student_rollno, exam_type, subject_code)
      )
    `);

    // Insert default admin
    const [adminRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM admin WHERE username = ?',
      ['admin']
    );

    if (adminRows[0].count === 0) {
      await pool.query(
        `
        INSERT INTO admin (name, department, year, mobile, username, password)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        ['Default Admin', 'Administration', 'III', '1234567890', 'admin', 'esec']
      );
      console.log('Default admin credentials inserted.');
    } else {
      console.log('Admin credentials already exist.');
    }

    console.log(" Database initialized.");
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
  }
}

module.exports = {
  pool,
  query,
  initializeDatabase
};
