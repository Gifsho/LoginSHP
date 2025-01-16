const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const CryptoJS = require("crypto-js");
const mongoose = require("mongoose");
const crypto = require('crypto');

const app = express();
const port = 3000;

mongoose
  .connect(
    "mongodb+srv://yossy:UCm53aKnr9kzdtUj@cluster0.rj3m9.mongodb.net/OSKDB?retryWrites=true&w=majority"
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.error("MongoDB Connection error:", error));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

app.use(bodyParser.json());

app.set('view engine', 'ejs'); 
app.use(express.static('views'));

app.get('/', (req, res) => { 
    res.render('login'); 
}); 

app.listen(port, () => { 
    console.log(`Server is running on http://localhost:${port}`); 
}); 

app.use(express.urlencoded({ extended: true }));

// เก็บ salt ชั่วคราว
const activeSalts = new Map();

// สร้าง salt สำหรับแต่ละ request
app.get('/getSalt', (req, res) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  
  // เก็บ salt พร้อม timestamp
  activeSalts.set(salt, timestamp);
  
  // ลบ salt ที่เก่าเกิน 5 นาที
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  activeSalts.forEach((timestamp, salt) => {
    if (timestamp < fiveMinutesAgo) {
      activeSalts.delete(salt);
    }
  });
  
  res.json({ salt });
});

app.post("/login", async (req, res) => {
  try {
    const { data, salt } = req.body;

    // ตรวจสอบว่า salt ยังใช้งานได้
    if (!activeSalts.has(salt)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired salt" 
      });
    }

    // ถอดรหัสข้อมูล
    const bytes = CryptoJS.AES.decrypt(data, salt);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    const { username, password } = decryptedData;

    // ลบ salt ที่ใช้แล้ว
    activeSalts.delete(salt);

    // ตรวจสอบ username และ password
    const user = await User.findOne({ username });

    if (user && user.password === password) {
      res.json({ success: true, token: "fake-token"});
    } else {
      res.json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
