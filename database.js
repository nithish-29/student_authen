const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

let lastScannedRFID = ""; 

// Get all students
app.get('/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM student_info');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Add new student
app.post('/new_student', async (req, res) => {
    const { student_name, rfid, status } = req.body;
    if (!student_name || !rfid) return res.status(400).json({ error: 'Missing fields' });

    try {
        const query = `INSERT INTO student_info (student_name, rfid, status) VALUES ($1, $2, $3) RETURNING *;`;
        const result = await pool.query(query, [student_name, rfid, status]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ error: 'Database insert failed' });
    }
});

// Mark student as present when scanning RFID
app.post('/scan', async (req, res) => {
    const { rfid } = req.body;
    if (!rfid) return res.status(400).json({ error: 'RFID required' });

    lastScannedRFID = rfid;
    try {
        const result = await pool.query(
            'UPDATE student_info SET status = $1 WHERE rfid = $2 RETURNING *;',
            [true, rfid]
        );
        if (result.rowCount > 0) return res.json({ message: 'Attendance Updated', student: result.rows[0] });

        res.status(404).json({ error: 'Student Not Found' });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ error: 'Database update failed' });
    }
});

// Get last scanned RFID
app.get('/rfid', (req, res) => {
    if (lastScannedRFID) return res.json({ rfid: lastScannedRFID });
    res.status(404).json({ message: 'No RFID scanned yet' });
});

// Reset all student statuses to Absent
app.post('/reset_attendance', async (req, res) => {
    try {
        await pool.query("UPDATE student_info SET status = false");
        res.json({ message: 'All students marked Absent' });
    } catch (error) {
        console.error('Error resetting attendance:', error);
        res.status(500).json({ error: 'Failed to reset attendance' });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
