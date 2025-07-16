const express = require('express');
const router = express.Router();
const { pool } = require('../db'); // Import MySQL pool from db.js
// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query admin and advisors only
    const [rows] = await pool.query(`
      SELECT username, password, 'admin' AS userType FROM admin WHERE username = ?
      UNION
      SELECT username, password, 'advisor' AS userType FROM advisors WHERE username = ?
      LIMIT 1
    `, [username, username]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];

    // Compare plain text password
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (user.userType === 'advisor') {
      // Fetch full advisor details
      const [advisorRows] = await pool.query(
        'SELECT * FROM advisors WHERE username = ?', [username]
      );
      const advisor = advisorRows[0];

      // Set full advisor info in session
      req.session.user = {
        username: advisor.username,
        userType: 'advisor',
        department: advisor.department,
        semester: advisor.semester,
        year: advisor.year,
        class: advisor.class
      };
    } else {
      // Admin user
      req.session.user = {
        username: user.username,
        userType: 'admin'
      };
    }

    return res.json({
      message: `${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} Login Successful`,
      userType: user.userType,
      redirectUrl: `/${user.userType}`
    });

  } catch (error) {
    console.error('Database or Server Error:', error.message);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;