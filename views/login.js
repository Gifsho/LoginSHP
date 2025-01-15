function generateRandomKey() {
  return CryptoJS.lib.WordArray.random(16); // สุ่มคีย์ 128 บิต
}

function encryptText(text, key, iv) {
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.toString();
}

async function login(event) {
  event.preventDefault();

  const Username = document.getElementById("u___n___").value;
  const Password = document.getElementById("p___w___").value;

  const encryptionKey = generateRandomKey();
  const iv = CryptoJS.lib.WordArray.random(16);

  const encryptedUsername = encryptText(Username, encryptionKey, iv);
  const encryptedPassword = encryptText(Password, encryptionKey, iv);

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: encryptedUsername,
        password: encryptedPassword,
        key: encryptionKey.toString(),
        iv: iv.toString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      alert("เข้าสู่ระบบสำเร็จ");
      localStorage.setItem("token", result.token);
      location.reload();
    } else {
      alert(result.message);
      location.reload();
    }
  } catch (error) {
    console.error("Error:", error);
    alert("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  loginButton.addEventListener("click", login);
});