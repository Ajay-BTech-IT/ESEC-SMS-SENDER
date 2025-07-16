const express = require('express');
const router = express.Router();
const { query } = require('../db'); // MySQL query utility
const { sendMarks } = require('./twilio'); // Adjust path as needed

const multer = require('multer');
const XLSX = require('xlsx');

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware: Check if user is authenticated and is an advisor
function isAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.userType === 'advisor') {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

// GET /api/advisor/get-advisor-details - Get advisor info
router.get('/get-advisor-details', isAuthenticated, async (req, res) => {
  const username = req.session.user.username;

  try {
    const [advisor] = await query(
      'SELECT name, department, semester, year, class FROM advisors WHERE username = ?',
      [username]
    );

    if (!advisor || Object.keys(advisor).length === 0) {
      return res.status(404).send('Advisor details not found');
    }

    res.json(advisor);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

// GET /api/advisor/get-students - Get students under advisor (with full details)
router.get('/get-students', isAuthenticated, async (req, res) => {
  const username = req.session.user.username;

  try {
    const [advisor] = await query(
      'SELECT department, year, semester, class FROM advisors WHERE username = ?',
      [username]
    );

    if (!advisor || Object.keys(advisor).length === 0) {
      return res.status(404).send('Advisor not found');
    }

    const { department, year, semester, class: className } = advisor;

    const students = await query(
      `
      SELECT * 
      FROM students 
      WHERE department = ? AND year = ? AND semester = ? AND class = ?
      ORDER BY rollno ASC
      `,
      [department, year, semester, className]
    );

    res.json(students);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});


// Middleware to ensure advisor is logged in
function isAdvisor(req, res, next) {
  if (req.session.user && req.session.user.userType === 'advisor') {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// GET /api/advisor/get-marks
router.get('/get-marks', isAdvisor, async (req, res) => {
  try {
    const { rollno, semester, department } = req.query;

    if (!rollno || !semester || !department) {
      return res.status(400).json({ message: 'Missing required query parameters' });
    }

    // Get subject names and marks from student_marks and subjects via JOIN
    const rows = await query(`
      SELECT 
        sm.subject_code,
        sm.exam_type,
        sm.marks,
        s.subject_name
      FROM student_marks sm
      JOIN subjects s 
        ON sm.subject_code = s.subject_code AND s.department = ?
      WHERE sm.student_rollno = ? AND s.semester = ?
    `, [department, rollno, semester]);

    // Organize results into exam-wise structure
    const marksByExam = {
      CAT1: {},
      CAT2: {},
      CAT3: {},
      MODEL: {},
    };

    const subjects = [];

    rows.forEach(row => {
      const code = row.subject_code;
      const name = row.subject_name;
      const exam = row.exam_type.toUpperCase();
      const mark = row.marks;

      if (!subjects.some(subj => subj.subject_code === code)) {
        subjects.push({ subject_code: code, subject_name: name });
      }

      if (marksByExam[exam]) {
        marksByExam[exam][code] = mark;
      }
    });

    res.json({
      subjects,
      CAT1: marksByExam.CAT1,
      CAT2: marksByExam.CAT2,
      CAT3: marksByExam.CAT3,
      MODEL: marksByExam.MODEL
    });

  } catch (err) {
    console.error('❌ ERROR FETCHING MARKS:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// GET /api/advisor/getStudentMarks/:rollno - Get student's current semester marks
router.get('/getStudentMarks/:rollno', isAuthenticated, async (req, res) => {
  const { rollno } = req.params;

  try {
    const result = await query(
      `SELECT semester FROM students WHERE rollno = ?`,
      [rollno]
    );

    if (!result || result.length === 0) {
      return res.status(404).send('Student not found');
    }

    const semester = result[0].semester;

    const marks = await query(
      `SELECT subject_code AS subject, exam_type, marks 
       FROM student_marks 
       WHERE student_rollno = ? AND semester = ?`,
      [rollno, semester]
    );

    res.json(marks);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

// // POST /api/advisor/send-marks - Send marks via Twilio
// router.post('/send-marks', isAuthenticated, async (req, res) => {
//   const { marksData } = req.body;

//   if (!Array.isArray(marksData) || marksData.length === 0) {
//     return res.status(400).json({ success: false, message: 'Invalid input' });
//   }

//   const results = [];

//   for (let item of marksData) {
//     const { rollno, examType } = item;

//     try {
//       // Fetch student
//       const [student] = await query('SELECT * FROM students WHERE rollno = ?', [rollno]);

//       if (!student || Object.keys(student).length === 0) {
//         results.push({ rollno, status: 'Student not found' });
//         continue;
//       }

//       // Fetch marks
//       const marks = await query(
//         `SELECT subject_code AS subject, marks 
//          FROM student_marks 
//          WHERE student_rollno = ? AND exam_type = ?`,
//         [rollno, examType]
//       );

//       if (!marks || marks.length === 0) {
//         results.push({ rollno, status: 'No marks found' });
//         continue;
//       }

//       // Send via Twilio
//       const sendResult = await sendMarks(student, examType, marks, req.session.user.name);

//       results.push({
//         rollno,
//         status: sendResult.success ? 'Sent' : 'Failed',
//         ...(sendResult.sid && { sid: sendResult.sid }),
//         ...(sendResult.error && { error: sendResult.error })
//       });

//     } catch (err) {
//       console.error(`Error sending to ${rollno}:`, err.message);
//       results.push({ rollno, status: 'Failed', error: err.message });
//     }
//   }

//   res.json({ success: true, results });
// });

router.post('/add-subjects', isAuthenticated, async (req, res) => {
  const { subjects } = req.body;
  const username = req.session.user.username; // Get username

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid subjects data' });
  }

  try {
    // ✅ Fetch advisor details from DB instead of session
    const [advisor] = await query(
      'SELECT department, year, semester FROM advisors WHERE username = ?',
      [username]
    );

    if (!advisor || !advisor.department) {
      return res.status(400).json({ success: false, message: 'Advisor details missing' });
    }

    const { department, semester, year } = advisor;

    let successCount = 0;
    let skippedSubjects = [];

    for (const subject of subjects) {
      const { code, name } = subject;
      if (!code || !name) continue;

      try {
        await query(
          'INSERT INTO subjects (subject_code, subject_name, department, year, semester) VALUES (?, ?, ?, ?, ?)',
          [code, name, department, year, semester]
        );
        successCount++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          skippedSubjects.push(code);
        } else {
          console.error('Error inserting subject:', err.message);
        }
      }
    }

    let message = `${successCount} subject(s) added successfully.`;
    if (skippedSubjects.length > 0) {
      message += ` Skipped: ${skippedSubjects.join(', ')} (already exist).`;
    }

    return res.json({
      success: true,
      message
    });

  } catch (err) {
    console.error('Error saving subjects:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

const fs = require('fs');
const path = require('path');


function isAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.userType === 'advisor') {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

router.post('/upload-marks', isAuthenticated, upload.single('file'), async (req, res) => {
  const { examType } = req.body;

  if (!req.file || !examType) {
    return res.status(400).json({ success: false, message: 'Missing file or exam type' });
  }

  try {
    console.log("📄 Received file:", req.file.originalname);
    console.log("📂 File path:", req.file.path);

    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only .xlsx files are allowed.'
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(worksheet);
    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, message: 'No data found in the sheet.' });
    }

    console.log(`✅ Parsed ${data.length} rows successfully`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const row of data) {
      const normalizedRow = {};
      for (const key in row) {
        normalizedRow[key.trim()] = row[key];
      }

      let registerNo = String(normalizedRow['student_rollno'] || '').trim();
      const studentName = String(normalizedRow['student_name'] || '').trim();

      if (!registerNo || !studentName) {
        skippedCount++;
        continue;
      }

      if (!isNaN(registerNo)) {
        registerNo = String(Number(registerNo)).replace(/\.0$/, '');
      }

      const [studentRows] = await query('SELECT class FROM students WHERE rollno = ?', [registerNo]);
      if (!studentRows || studentRows.length === 0) {
        console.log(`Student not found: ${registerNo}`);
        skippedCount++;
        continue;
      }

      for (const key in normalizedRow) {
        const subjectCode = key.trim();
        if (['student_rollno', 'student_name'].includes(subjectCode)) continue;

        const marks = normalizedRow[subjectCode];
        if ([null, undefined, ''].includes(marks)) continue;

        try {
          await query(
            `
            INSERT INTO student_marks (
              student_rollno, student_name, exam_type, subject_code, marks
            ) VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE marks = ?
            `,
            [registerNo, studentName, examType.toUpperCase(), subjectCode, marks, marks]
          );
          insertedCount++;
        } catch (err) {
          console.error(`Insert failed for ${registerNo} ${subjectCode}:`, err.message);
        }
      }
    }

    return res.json({
      success: true,
      message: `${insertedCount} mark(s) inserted successfully. ${skippedCount} student(s) were skipped.`
    });

  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error processing file.',
      error: err.message
    });
  }
});



// router.post('/send-marks', isAuthenticated, async (req, res) => {
//   const { marksData } = req.body;

//   if (!Array.isArray(marksData) || marksData.length === 0) {
//     return res.status(400).json({ success: false, message: 'Invalid input' });
//   }

//   const results = [];

//   for (const item of marksData) {
//     const { rollno, examType } = item;

//     try {
//       const [student] = await query('SELECT * FROM students WHERE rollno = ?', [rollno]);

//       if (!student) {
//         results.push({ rollno, status: 'Student not found' });
//         continue;
//       }

//       const rawMarks = await query(
//         `SELECT subject_code AS subject, marks 
//          FROM student_marks 
//          WHERE student_rollno = ? AND exam_type = ?`,
//         [rollno, examType]
//       );

//       if (!rawMarks.length) {
//         results.push({ rollno, status: 'No marks found' });
//         continue;
//       }

//       // Parse the marks (JSON string) into usable format
//       const marksParsed = rawMarks.map((entry) => ({
//         subject: entry.subject,
//         [examType.toUpperCase()]: JSON.parse(entry.marks)
//       }));

//       const sendResult = await sendMarks(student, examType, marksParsed, req.session.user.name);

//       results.push({
//         rollno,
//         status: sendResult.success ? 'Sent' : 'Failed',
//         ...(sendResult.sid && { sid: sendResult.sid }),
//         ...(sendResult.error && { error: sendResult.error })
//       });
//     } catch (err) {
//       console.error(`❌ Error sending to ${rollno}:`, err.message);
//       results.push({ rollno, status: 'Failed', error: err.message });
//     }
//   }

//   res.json({ success: true, results });
// });

router.post('/send-marks', isAuthenticated, async (req, res) => {
  const { marksData } = req.body;

  if (!Array.isArray(marksData) || marksData.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }

  const results = [];

  for (const item of marksData) {
    const { rollno, examType } = item;

    try {
      const [student] = await query('SELECT * FROM students WHERE rollno = ?', [rollno]);

      if (!student) {
        results.push({ rollno, status: 'Student not found' });
        continue;
      }

      const rawMarks = await query(
        `SELECT subject_code AS subject, marks 
         FROM student_marks 
         WHERE student_rollno = ? AND exam_type = ?`,
        [rollno, examType]
      );

      if (!rawMarks.length) {
        results.push({ rollno, status: 'No marks found' });
        continue;
      }

      const marksParsed = rawMarks.map((entry) => {
        let parsedMark;
        try {
          parsedMark = JSON.parse(entry.marks); // try parse as JSON
        } catch (e) {
          parsedMark = entry.marks; // fallback to string
        }
        return {
          subject: entry.subject,
          [examType.toUpperCase()]: parsedMark
        };
      });

      console.log(`📤 Sending marks for ${rollno}:`, marksParsed);

      const sendResult = await sendMarks(student, examType, marksParsed, req.session.user.name);

      console.log(`📬 Result for ${rollno}:`, sendResult);

      results.push({
        rollno,
        status: sendResult.success ? 'Sent' : 'Failed',
        ...(sendResult.sid && { sid: sendResult.sid }),
        ...(sendResult.error && { error: sendResult.error })
      });
    } catch (err) {
      console.error(`❌ Error sending to ${rollno}:`, err.message);
      results.push({ rollno, status: 'Failed', error: err.message });
    }
  }

  console.log('📦 Final send-marks response:', results);

  res.json({ success: true, results });
});

module.exports = router;