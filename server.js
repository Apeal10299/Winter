const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Initialize SQLite Database (creates winter_arc.db file on server)
const db = new sqlite3.Database('./winter_arc.db', (err) => {
    if (err) console.error('Database opening error: ', err.message);
    else console.log('Connected to SQLite database.');
});

// Create table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS daily_logs (
    date TEXT PRIMARY KEY,
    checks TEXT,
    dsa INTEGER,
    money TEXT,
    win TEXT
)`);

// GET progress for a specific date
app.get('/api/progress/:date', (req, res) => {
    const { date } = req.params;
    db.get(`SELECT * FROM daily_logs WHERE date = ?`, [date], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.json({ checks: "0,0,0,0,0,0,0,0,0", dsa: 0, money: "", win: "" });
        } else {
            res.json({
                checks: row.checks,
                dsa: row.dsa,
                money: row.money,
                win: row.win
            });
        }
    });
});

// POST / SAVE progress for a specific date
app.post('/api/progress', (req, res) => {
    const { date, checks, dsa, money, win } = req.body;
    
    db.run(`INSERT INTO daily_logs (date, checks, dsa, money, win) 
            VALUES (?, ?, ?, ?, ?) 
            ON CONFLICT(date) DO UPDATE SET 
            checks = excluded.checks,
            dsa = excluded.dsa,
            money = excluded.money,
            win = excluded.win`,
        [date, checks, dsa, money, win],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ success: true, message: "Progress locked in successfully." });
            }
        }
    );
});

app.listen(PORT, () => {
    console.log(`Tactical backend running on port ${PORT}`);
});