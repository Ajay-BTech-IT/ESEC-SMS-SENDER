const express = require('express');
//const { pool, query } = require('../db'); // Import MySQL connection
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');

// Configure multer for file upload

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });
// Middleware to parse Excel file
function parseExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
}

const { pool, query } = require('../db');


// Add Student
router.post('/add-student', async (req, res) => {
  const {
    rollno,
    name,
    department,
    year,
    class: className,
    email,
    semester,
    whatsapp,
    language
  } = req.body;

  if (!rollno || !name || !department || !year || !className) {
    return res.status(400).json({ message: '❌ Missing required fields!' });
  }

  try {
    await query(
      `INSERT INTO students (rollno, name, department, year, class, email, semester, whatsapp, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rollno, name, department, year, className, email, semester, whatsapp, language]
    );
    return res.json({ message: '✅ Student added successfully!' });
  } catch (err) {
    console.error('Error adding student:', err.message);
    return res.status(500).json({ message: `❌ Error adding student: ${err.message}` });
  }
});// Make sure you import the correct function
 // Adjust path accordingly

router.post('/add-advisor', async (req, res) => {
  const {
    advisorid,
    name,
    department,
    year,
    class: className,
    semester,
    username,
    password,
    mobile
  } = req.body;

  if (!advisorid || !username || !password || !department || !year || !className || !semester) {
    return res.status(400).json({ message: '❌ Missing required fields!' });
  }

  try {
    // Step 1: Insert advisor into database
    await query(
      `INSERT INTO advisors (advisorid, name, department, year, class, semester, username, password, mobile)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [advisorid, name, department, year, className, semester, username, password, mobile]
    );

    // Step 2: Create one unified marks table for this advisor's class
  //  await createMarksTable(department, year, className); // <-- Singular version used here

    return res.json({ message: '✅ Advisor and marks table created successfully!' });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.error('Duplicate entry:', err.message);
      return res.status(400).json({ message: '❌ Username or Advisor ID already exists!' });
    }
    console.error('Error adding advisor:', err.message);
    return res.status(500).json({ message: `❌ Error adding advisor: ${err.message}` });
  }
});

// Add Admin
router.post('/add-admin', async (req, res) => {
  const { name, department, year, mobile, username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '❌ Username and password are required!' });
  }

  try {
    await query(
      `INSERT INTO admin (name, department, year, mobile, username, password)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, department, year, mobile, username, password]
    );
    return res.json({ message: '✅ Admin added successfully!' });
  } catch (err) {
    console.error('Error adding admin:', err.message);
    return res.status(500).json({ message: `❌ Error adding admin: ${err.message}` });
  }
});

// Get Student by Roll No
router.get('/get-student/:rollno', async (req, res) => {
  const rollno = req.params.rollno;
  try {
    const student = await query('SELECT * FROM students WHERE rollno = ?', [rollno]);
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    return res.json(student[0]);
  } catch (err) {
    console.error('Error fetching student:', err.message);
    return res.status(500).json({ message: `DB Error: ${err.message}` });
  }
});

// Get Advisor by ID
router.get('/get-advisor/:advisorid', async (req, res) => {
  const advisorid = req.params.advisorid;
  try {
    const advisor = await query('SELECT * FROM advisors WHERE advisorid = ?', [advisorid]);
    if (advisor.length === 0) {
      return res.status(404).json({ message: 'Advisor not found' });
    }
    return res.json(advisor[0]);
  } catch (err) {
    console.error('Error fetching advisor:', err.message);
    return res.status(500).json({ message: `DB Error: ${err.message}` });
  }
});

// Update Student
router.put('/update-student', async (req, res) => {
  const {
    rollno,
    name,
    department,
    year,
    class: className,
    email,
    semester,
    whatsapp,
    language
  } = req.body;

  if (!rollno) {
    return res.status(400).json({ message: '❌ Roll number is required!' });
  }

  try {
    const result = await query(
      `UPDATE students SET name = ?, department = ?, year = ?, class = ?, email = ?, semester = ?, whatsapp = ?, language = ? WHERE rollno = ?`,
      [name, department, year, className, email, semester, whatsapp, language, rollno]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found!' });
    }

    return res.json({ message: '✅ Student updated successfully!' });
  } catch (err) {
    console.error('Error updating student:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});
// Bulk Update Students
router.put('/update-all-students', async (req, res) => {
  const { students } = req.body;

  console.log('Received bulk student update request:', req.body);

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: '❌ No students provided for update!' });
  }

  let updatedCount = 0;

  try {
    for (const student of students) {
      const {
        rollno,
        name,
        department,
        year,
        class: className,
        email,
        semester,
        whatsapp,
        language
      } = student;

      if (!rollno) {
        console.warn('Skipping student due to missing roll number:', student);
        continue;
      }

      const updateFields = {};
      if (name !== undefined) updateFields.name = name;
      if (department !== undefined) updateFields.department = department;
      if (year !== undefined) updateFields.year = year;
      if (className !== undefined) updateFields.class = className;
      if (email !== undefined) updateFields.email = email;
      if (semester !== undefined) updateFields.semester = semester;
      if (whatsapp !== undefined) updateFields.whatsapp = whatsapp;
      if (language !== undefined) updateFields.language = language;

      if (Object.keys(updateFields).length === 0) {
        console.log(`No changes to update for student: ${rollno}`);
        continue;
      }

      const setClause = Object.keys(updateFields)
        .map(key => `${key} = ?`)
        .join(', ');

      const values = Object.values(updateFields);
      values.push(rollno); // WHERE condition

      const result = await query(
        `UPDATE students SET ${setClause} WHERE rollno = ?`,
        values
      );

      if (result.affectedRows > 0) {
        updatedCount++;
      }
    }

    return res.json({
      message: `✅ Successfully updated ${updatedCount} out of ${students.length} students.`,
      updatedCount,
      total: students.length
    });

  } catch (err) {
    console.error('Error during bulk student update:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});

// Bulk Update Admins
router.put('/update-all-admins', async (req, res) => {
  const { admins } = req.body;

  console.log('Received bulk admin update request:', req.body);

  if (!admins || !Array.isArray(admins) || admins.length === 0) {
    return res.status(400).json({ message: '❌ No admins provided for update!' });
  }

  let updatedCount = 0;

  try {
    for (const admin of admins) {
      const {
        username,
        name,
        department,
        year,
        mobile
      } = admin;

      if (!username) {
        console.warn('Skipping admin due to missing username:', admin);
        continue;
      }

      const updateFields = {};
      if (name !== undefined) updateFields.name = name;
      if (department !== undefined) updateFields.department = department;
      if (year !== undefined) updateFields.year = year;
      if (mobile !== undefined) updateFields.mobile = mobile;

      if (Object.keys(updateFields).length === 0) {
        console.log(`No changes to update for admin: ${username}`);
        continue;
      }

      const setClause = Object.keys(updateFields)
        .map(key => `${key} = ?`)
        .join(', ');

      const values = Object.values(updateFields);
      values.push(username); // WHERE condition

      const result = await query(
        `UPDATE admin SET ${setClause} WHERE username = ?`,
        values
      );

      if (result.affectedRows > 0) {
        updatedCount++;
      }
    }

    return res.json({
      message: `✅ Successfully updated ${updatedCount} out of ${admins.length} admins.`,
      updatedCount,
      total: admins.length
    });

  } catch (err) {
    console.error('Error during bulk admin update:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});

// Remove Student
router.delete('/remove-student/:rollno', async (req, res) => {
  const rollno = req.params.rollno;

  try {
    // Step 1: Get all dynamic marks tables
    const tables = await query(`
      SELECT TABLE_NAME FROM information_schema.tables
      WHERE TABLE_SCHEMA = 'collegedb'
      AND TABLE_NAME LIKE 'Cat%_student_marks_%'
    `);

    // Step 2: Delete student from each dynamic table
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      await query(`DELETE FROM ?? WHERE student_rollno = ?`, [tableName, rollno]);
    }

    // Step 3: Delete student from main table
    const result = await query('DELETE FROM students WHERE rollno = ?', [rollno]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found!' });
    }

    return res.json({ message: '✅ Student and related marks deleted successfully!' });

  } catch (err) {
    console.error('Error removing student:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});

// Get Admin by Username
router.get('/get-admin/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const admin = await query('SELECT * FROM admin WHERE username = ?', [username]);
    if (admin.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    return res.json(admin[0]);
  } catch (err) {
    console.error('Error fetching admin:', err.message);
    return res.status(500).json({ message: `DB Error: ${err.message}` });
  }
});router.post('/bulk-upload-students', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '❌ No file uploaded!' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: '❌ No student data found in file!' });
    }

    let insertedCount = 0;

    for (const row of data) {
      const {
        rollno,
        name,
        department,
        year,
        class: className,
        email,
        semester,
        whatsapp,
        language
      } = row;

      if (!rollno) continue;

      try {
        await query(
          `INSERT IGNORE INTO students (rollno, name, department, year, class, email, semester, whatsapp, language)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [rollno, name, department, year, className, email, semester, whatsapp, language]
        );
        insertedCount++;
      } catch (err) {
        console.error('Error inserting student:', err.message);
      }
    }

    return res.json({
      message: `✅ Successfully uploaded ${insertedCount} out of ${data.length} students.`,
      insertedCount,
      total: data.length
    });

  } catch (err) {
    console.error('Error parsing Excel file:', err.message);
    return res.status(500).json({ message: `❌ File Error: ${err.message}` });
  }
});

router.post('/bulk-upload-advisors', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '❌ No file uploaded!' });
  }

  try {
    const data = parseExcelFile(req.file.path);
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: '❌ No advisor data found in file!' });
    }

    let insertedCount = 0;

    for (const row of data) {
      const {
        advisorid,
        name,
        department,
        year,
        class: className,
        semester,
        username,
        password,
        mobile
      } = row;

      if (!advisorid || !department || !year || !className || !semester) {
        console.warn('Skipping incomplete advisor:', row);
        continue;
      }

      try {
        // Insert advisor into database
        await query(
          `INSERT INTO advisors (advisorid, name, department, year, class, semester, username, password, mobile)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             department = VALUES(department),
             year = VALUES(year),
             class = VALUES(class),
             semester = VALUES(semester),
             username = VALUES(username),
             password = VALUES(password),
             mobile = VALUES(mobile)`,
          [advisorid, name, department, year, className, semester, username, password, mobile]
        );

        insertedCount++;
      } catch (err) {
        console.error('Error inserting advisor:', err.message);
      }
    }

    return res.json({
      message: `✅ Successfully uploaded ${insertedCount} out of ${data.length} advisors.`,
      insertedCount,
      total: data.length
    });

  } catch (err) {
    console.error('Error parsing file:', err.message);
    return res.status(500).json({ message: `❌ File Error: ${err.message}` });
  }
});

router.post('/bulk-upload-admins', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '❌ No file uploaded!' });
  }

  try {
    const data = parseExcelFile(req.file.path);
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: '❌ No admin data found in file!' });
    }

    let insertedCount = 0;

    for (const row of data) {
      const {
        username,
        name,
        department,
        year,
        mobile
      } = row;

      if (!username) continue;

      try {
        await query(
          `INSERT INTO admin (username, name, department, year, mobile)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             department = VALUES(department),
             year = VALUES(year),
             mobile = VALUES(mobile)`,
          [username, name, department, year, mobile]
        );
        insertedCount++;
      } catch (err) {
        console.error('Error inserting admin:', err.message);
      }
    }

    return res.json({
      message: `✅ Successfully uploaded ${insertedCount} out of ${data.length} admins.`,
      insertedCount,
      total: data.length
    });

  } catch (err) {
    console.error('Error parsing file:', err.message);
    return res.status(500).json({ message: `❌ File Error: ${err.message}` });
  }
});

// Filter Students
router.get('/filter-students', async (req, res) => {
  const { department, year, class: className, language } = req.query;
  let filterConditions = [];
  let filterValues = [];

  if (department) {
    filterConditions.push(`LOWER(department) = ?`);
    filterValues.push(department.toLowerCase());
  }
  if (year) {
    filterConditions.push(`CAST(year AS CHAR) = ?`);
    filterValues.push(year.toString());
  }
  if (className) {
    filterConditions.push(`LOWER(class) = ?`);
    filterValues.push(className.toLowerCase());
  }
  if (language) {
    filterConditions.push(`LOWER(language) = ?`);
    filterValues.push(language.toLowerCase());
  }

  try {
    const rows = await query(
      `SELECT * FROM students ${filterConditions.length ? 'WHERE ' + filterConditions.join(' AND ') : ''} ORDER BY department ASC`,
      filterValues
    );
    return res.json(rows);
  } catch (err) {
    console.error('Error filtering students:', err.message);
    return res.status(500).json({ message: `Failed to filter students: ${err.message}` });
  }
});

// Filter Advisors
router.get('/filter-advisors', async (req, res) => {
  const { department, year, class: className } = req.query;
  let filterConditions = [];
  let filterValues = [];

  if (department) {
    filterConditions.push(`LOWER(department) = ?`);
    filterValues.push(department.toLowerCase());
  }
  if (year) {
    filterConditions.push(`CAST(year AS CHAR) = ?`);
    filterValues.push(year.toString());
  }
  if (className) {
    filterConditions.push(`LOWER(class) = ?`);
    filterValues.push(className.toLowerCase());
  }

  try {
    const rows = await query(
      `SELECT * FROM advisors ${filterConditions.length ? 'WHERE ' + filterConditions.join(' AND ') : ''} ORDER BY department ASC`,
      filterValues
    );
    return res.json(rows);
  } catch (err) {
    console.error('Error filtering advisors:', err.message);
    return res.status(500).json({ message: `Failed to filter advisors: ${err.message}` });
  }
});

// Filter Admins
router.get('/filter-admins', async (req, res) => {
  const { department, year } = req.query;
  let filterConditions = [];
  let filterValues = [];

  if (department) {
    filterConditions.push(`LOWER(department) = ?`);
    filterValues.push(department.toLowerCase());
  }
  if (year) {
    filterConditions.push(`LOWER(year) = ?`);
    filterValues.push(year.toLowerCase());
  }

  try {
    const rows = await query(
      `SELECT * FROM admin ${filterConditions.length ? 'WHERE ' + filterConditions.join(' AND ') : ''} ORDER BY department ASC`,
      filterValues
    );
    return res.json(rows);
  } catch (err) {
    console.error('Error filtering admins:', err.message);
    return res.status(500).json({ message: `Failed to filter admins: ${err.message}` });
  }
});

// Bulk Remove Students
router.delete('/remove-students', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: '❌ No student IDs provided!' });
  }

  try {
    // Step 1: Delete from dynamic marks tables
    const tables = await query(`
      SELECT TABLE_NAME FROM information_schema.tables
      WHERE TABLE_SCHEMA = 'collegedb'
      AND TABLE_NAME LIKE 'Cat%_student_marks_%'
    `);

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      await query(`DELETE FROM ?? WHERE student_rollno IN (?)`, [tableName, ids]);
    }

    // Step 2: Delete from main students table
    const placeholders = ids.map(() => '?').join(',');
    await query(`DELETE FROM students WHERE rollno IN (${placeholders})`, ids);

    return res.json({ message: `✅ Removed ${ids.length} students and related marks successfully!` });

  } catch (err) {
    console.error('Error removing students:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});

// Bulk Remove Advisors
router.delete('/remove-advisors', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: '❌ No advisor IDs provided!' });
  }
  try {
    // Step 1: Delete from dynamic marks tables (if needed)
    const tables = await query(`
      SELECT TABLE_NAME FROM information_schema.tables
      WHERE TABLE_SCHEMA = 'collegedb'
      AND TABLE_NAME LIKE 'Cat%_student_marks_%'
    `);

    // Optional: If advisors are linked to any table, delete here
    // For now, assuming no foreign key constraints

    // Step 2: Delete from main advisors table
    const placeholders = ids.map(() => '?').join(',');
    await query(`DELETE FROM advisors WHERE advisorid IN (${placeholders})`, ids);

    return res.json({ message: `✅ Removed ${ids.length} advisors successfully!` });
  } catch (err) {
    console.error('Error removing advisors:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});

// Remove Single Advisor by ID
router.delete('/remove-advisor/:advisorid', async (req, res) => {
  const advisorId = req.params.advisorid;

  try {
    // Step 1: Delete from main advisors table
    const result = await query('DELETE FROM advisors WHERE advisorid = ?', [advisorId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Advisor not found!' });
    }

    return res.json({ message: '✅ Advisor removed successfully!' });
  } catch (err) {
    console.error('Error removing advisor:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});

// Update Single Advisor
router.put('/update-advisor', async (req, res) => {
  const {
    advisorid,
    name,
    department,
    year,
    class: className,
    semester,
    username,
    password,
    mobile
  } = req.body;

  if (!advisorid) {
    return res.status(400).json({ message: '❌ Advisor ID is required!' });
  }

  try {
    // Only update fields that are provided
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (department !== undefined) updateFields.department = department;
    if (year !== undefined) updateFields.year = year;
    if (className !== undefined) updateFields.class = className;
    if (semester !== undefined) updateFields.semester = semester;
    if (username !== undefined) updateFields.username = username;
    if (password !== undefined) updateFields.password = password;
    if (mobile !== undefined) updateFields.mobile = mobile;

    const setClause = Object.keys(updateFields)
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.values(updateFields);
    values.push(advisorid); // WHERE condition

    const result = await query(
      `UPDATE advisors SET ${setClause} WHERE advisorid = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Advisor not found!' });
    }

    return res.json({ message: '✅ Advisor updated successfully!' });
  } catch (err) {
    console.error('Error updating advisor:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});// Bulk Update Advisors
router.put('/update-all-advisors', async (req, res) => {
  const { advisors } = req.body;

  console.log('Received payload:', req.body); // 👈 Optional: For debugging

  if (!advisors || !Array.isArray(advisors) || advisors.length === 0) {
    return res.status(400).json({ message: '❌ No advisors provided for update!' });
  }

  let updatedCount = 0;

  try {
    for (const advisor of advisors) {
      const {
        advisorid,
        name,
        department,
        year,
        class: className,
        semester,
        username,
        password,
        mobile
      } = advisor;

      if (!advisorid) {
        console.warn('Skipping advisor due to missing advisorid:', advisor);
        continue;
      }

      const updateFields = {};
      if (name !== undefined) updateFields.name = name;
      if (department !== undefined) updateFields.department = department;
      if (year !== undefined) updateFields.year = year;
      if (className !== undefined) updateFields.class = className;
      if (semester !== undefined) updateFields.semester = semester;
      if (username !== undefined) updateFields.username = username;
      if (password !== undefined) updateFields.password = password;
      if (mobile !== undefined) updateFields.mobile = mobile;

      if (Object.keys(updateFields).length === 0) {
        console.log(`No changes to update for advisor ID: ${advisorid}`);
        continue;
      }

      const setClause = Object.keys(updateFields)
        .map(key => `${key} = ?`)
        .join(', ');

      const values = Object.values(updateFields);
      values.push(advisorid); // WHERE condition

      const result = await query(
        `UPDATE advisors SET ${setClause} WHERE advisorid = ?`,
        values
      );

      if (result.affectedRows > 0) {
        updatedCount++;
      }
    }

    return res.json({
      message: `✅ Successfully updated ${updatedCount} out of ${advisors.length} advisors.`,
      updatedCount,
      total: advisors.length
    });

  } catch (err) {
    console.error('Error during bulk update:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});

// Update Single Admin
router.put('/update-admin', async (req, res) => {
  const {
    username,
    name,
    department,
    year,
    mobile
  } = req.body;

  if (!username) {
    return res.status(400).json({ message: '❌ Username is required!' });
  }

  try {
    // Only update fields that are provided
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (department !== undefined) updateFields.department = department;
    if (year !== undefined) updateFields.year = year;
    if (mobile !== undefined) updateFields.mobile = mobile;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: '❌ No fields provided for update!' });
    }

    const setClause = Object.keys(updateFields)
      .map(key => `${key} = ?`)
      .join(', ');

    const values = Object.values(updateFields);
    values.push(username); // WHERE condition

    const result = await query(
      `UPDATE admin SET ${setClause} WHERE username = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Admin not found!' });
    }

    return res.json({ message: '✅ Admin updated successfully!' });

  } catch (err) {
    console.error('Error updating admin:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});

// Bulk Update Admins
router.put('/update-all-admins', async (req, res) => {
  const { admins } = req.body;

  console.log('Received bulk admin update request:', req.body);

  if (!admins || !Array.isArray(admins) || admins.length === 0) {
    return res.status(400).json({ message: '❌ No admins provided for update!' });
  }

  let updatedCount = 0;

  try {
    for (const admin of admins) {
      const {
        username,
        name,
        department,
        year,
        mobile
      } = admin;

      if (!username) {
        console.warn('Skipping admin due to missing username:', admin);
        continue;
      }

      const updateFields = {};
      if (name !== undefined) updateFields.name = name;
      if (department !== undefined) updateFields.department = department;
      if (year !== undefined) updateFields.year = year;
      if (mobile !== undefined) updateFields.mobile = mobile;

      if (Object.keys(updateFields).length === 0) {
        console.log(`No changes to update for admin: ${username}`);
        continue;
      }

      const setClause = Object.keys(updateFields)
        .map(key => `${key} = ?`)
        .join(', ');

      const values = Object.values(updateFields);
      values.push(username); // WHERE condition

      const result = await query(
        `UPDATE admin SET ${setClause} WHERE username = ?`,
        values
      );

      if (result.affectedRows > 0) {
        updatedCount++;
      }
    }

    return res.json({
      message: `✅ Successfully updated ${updatedCount} out of ${admins.length} admins.`,
      updatedCount,
      total: admins.length
    });

  } catch (err) {
    console.error('Error during bulk update:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});
// File Upload Endpoint (Generic)
router.post('/upload-file', upload.single('file'), async (req, res) => {
  const { uploadedBy } = req.body;

  if (!req.file || !uploadedBy) {
    return res.status(400).json({ message: '❌ Missing required fields or file!' });
  }

  const {
    originalname,
    path: filePath
  } = req.file;

  try {
    await query(
      `INSERT INTO uploaded_files (name, path, uploaded_by)
       VALUES (?, ?, ?)`,
      [originalname, filePath, uploadedBy]
    );

    return res.json({ message: '✅ File uploaded and stored in database!' });

  } catch (err) {
    console.error('Error storing file info:', err.message);
    return res.status(500).json({ message: `❌ DB Error: ${err.message}` });
  }
});

module.exports = router;