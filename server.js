const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "washmate_db"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL database");
    }
});

app.post("/register", (req, res) => {
    const { fullname, email, password } = req.body;

    const sql = "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";
    db.query(sql, [fullname, email, password], (err) => {
        if (err) {
            res.json({ success: false, message: "Registration failed" });
        } else {
            res.json({ success: true, message: "Registered successfully" });
        }
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, result) => {
        if (result.length > 0) {
            res.json({ success: true, user: result[0] });
        } else {
            res.json({ success: false, message: "Invalid login details" });
        }
    });
});

app.post("/order", (req, res) => {
    const { user_id, service_type, weight, pickup_date } = req.body;
    const total_amount = weight * 50;

    const sql = "INSERT INTO laundry_orders (user_id, service_type, weight, pickup_date, total_amount) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [user_id, service_type, weight, pickup_date, total_amount], (err) => {
        if (err) {
            res.json({ success: false, message: "Order failed" });
        } else {
            res.json({ success: true, message: "Laundry order submitted" });
        }
    });
});

app.get("/orders", (req, res) => {
    const sql = `
        SELECT laundry_orders.*, users.fullname 
        FROM laundry_orders 
        JOIN users ON laundry_orders.user_id = users.id
        ORDER BY laundry_orders.created_at DESC
    `;

    db.query(sql, (err, result) => {
        res.json(result);
    });
});

app.put("/update-status/:id", (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    const sql = "UPDATE laundry_orders SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err) => {
        if (err) {
            res.json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});

app.get("/my-orders/:user_id", (req, res) => {
    const { user_id } = req.params;

    const sql = "SELECT * FROM laundry_orders WHERE user_id = ? ORDER BY created_at DESC";

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            res.json([]);
        } else {
            res.json(result);
        }
    });
});

app.put("/pay-order/:id", (req, res) => {
    const { id } = req.params;
    const { payment_method } = req.body;

    const sql = `
        UPDATE laundry_orders 
        SET payment_method = ?, payment_status = 'Paid'
        WHERE id = ?
    `;

    db.query(sql, [payment_method, id], (err) => {
        if (err) {
            res.json({ success: false, message: "Payment failed" });
        } else {
            res.json({ success: true, message: "Payment successful" });
        }
    });
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});