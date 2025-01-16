async function login(event) {
  event.preventDefault();

  const username = document.getElementById("u___n___").value;
  const password = document.getElementById("p___w___").value;

  try {
    // ขอ salt จาก server สำหรับการเข้ารหัสครั้งนี้
    const saltResponse = await fetch("/getSalt");
    const { salt } = await saltResponse.json();

    // เข้ารหัสข้อมูลด้วย salt ที่ได้
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify({ username, password }),
      salt,
      {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    ).toString();

    console.log(encryptedData);
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: encryptedData,
        salt: salt
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
