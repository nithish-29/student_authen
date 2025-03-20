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

app.get('/students', async (req, res) => {
    const result = await pool.query('SELECT * FROM student_info');
    res.json(result.rows);
});

app.post('/new_student', async (req, res) => {
    const { student_name, rfid, status } = req.body;
    if (!student_name || !rfid) return res.status(400).json({ error: 'Missing fields' });

    const query = `INSERT INTO student_info (student_name, rfid, status) VALUES ($1, $2, $3) RETURNING *;`;
    const result = await pool.query(query, [student_name, rfid, status]);
    res.status(201).json(result.rows[0]);
});

app.post('/scan', async (req, res) => {
    const { rfid } = req.body;
    if (!rfid) return res.status(400).json({ error: 'RFID required' });

    lastScannedRFID = rfid;
    const result = await pool.query('UPDATE student_info SET status = $1 WHERE rfid = $2 RETURNING *;', [true, rfid]);
    if (result.rowCount > 0) return res.json({ message: 'Attendance Updated', student: result.rows[0] });

    res.status(404).json({ error: 'Student Not Found' });
});

app.get('/rfid', (req, res) => {
    if (lastScannedRFID) return res.json({ rfid: lastScannedRFID });
    res.status(404).json({ message: 'No RFID scanned yet' });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
