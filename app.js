const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const CryptoJS = require("crypto-js");
const mongoose = require("mongoose");

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

function decryptText(encryptedText, key, iv) {
  const bytes = CryptoJS.AES.decrypt(
    encryptedText,
    CryptoJS.enc.Hex.parse(key),
    {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return bytes.toString(CryptoJS.enc.Utf8);
}

app.post("/login", async (req, res) => {
  try {
    const { username, password, key, iv } = req.body;

    if (!username || !password || !key || !iv) {
      throw new Error("Missing required fields");
    }

    const decryptedUsername = decryptText(username, key, iv);
    const decryptedPassword = decryptText(password, key, iv);

    const user = await User.findOne({ username: decryptedUsername });

    if (user && user.password === decryptedPassword) {
      res.json({ success: true, token: "fake-token" });
    } else {
      res.json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
