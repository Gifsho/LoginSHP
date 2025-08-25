(function () {
  const SOSK_PAGE_SOURCE = 'SOSK_PAGE';
  const SOSK_CONTENT_SOURCE = 'SOSK_CONTENT';

  function generateRequestId() {
    return `sosk_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  function soskRpc(action, payload = {}, options = {}) {
    const { timeoutMs = 3000 } = options;
    return new Promise((resolve, reject) => {
      const requestId = generateRequestId();

      function onMessage(evt) {
        const data = evt && evt.data;
        if (!data || data.source !== SOSK_CONTENT_SOURCE || data.requestId !== requestId) return;
        window.removeEventListener('message', onMessage);
        if (data.ok) resolve(data.result);
        else reject(new Error(data.error || 'SOSK RPC error'));
      }

      window.addEventListener('message', onMessage);
      window.postMessage({ source: SOSK_PAGE_SOURCE, action, requestId, ...payload }, '*');

      if (timeoutMs > 0) {
        setTimeout(() => {
          window.removeEventListener('message', onMessage);
          reject(new Error('SOSK RPC timeout'));
        }, timeoutMs);
      }
    });
  }

  async function soskEncrypt(text, options) {
    if (typeof text !== 'string') throw new TypeError('soskEncrypt: text must be a string');
    return soskRpc('encrypt', { text }, options); // => { enc: { iv, data } }
  }

  async function soskDecrypt(payload, options) {
    if (!payload || !payload.iv || !payload.data) throw new TypeError('soskDecrypt: payload must contain iv and data');
    return soskRpc('decrypt', { payload }, options); // => { text }
  }

  window.sosk = {
    rpc: soskRpc,
    encrypt: soskEncrypt,
    decrypt: soskDecrypt,
  };

  try {
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = window.sosk;
    }
  } catch (_) {}
})();

async function login(event) {
    event.preventDefault();
  
    // Read input elements
    const uEl = document.getElementById("u___n___");
    const pEl = document.getElementById("p___w___");
    
    let finalUsername = "";
    let finalPassword = "";
    
    // Try to get data from encrypted attribute first, then fallback to input.value
    try {
      if (window.VKCrypto && typeof window.VKCrypto.decrypt === "function") {
        const encUser = uEl && uEl.dataset ? uEl.dataset.encrypted : undefined;
        const encPass = pEl && pEl.dataset ? pEl.dataset.encrypted : undefined;
        
        // For username: use encrypted data if available, otherwise use input.value
        if (encUser) {
          const decUser = window.VKCrypto.decrypt(encUser);
          finalUsername = decUser || uEl.value;
        } else {
          finalUsername = uEl.value;
        }
        
        // For password: use encrypted data if available, otherwise use input.value
        if (encPass) {
          const decPass = window.VKCrypto.decrypt(encPass);
          finalPassword = decPass || pEl.value;
        } else {
          finalPassword = pEl.value;
        }
      } else {
        // No VKCrypto available, use input values directly
        finalUsername = uEl.value;
        finalPassword = pEl.value;
      }
    } catch (e) {
      console.warn("Decryption failed, using input values:", e);
      finalUsername = uEl.value;
      finalPassword = pEl.value;
    }
    
    // console.log("Login attempt with username:", finalUsername);
    // console.log("Password length:", finalPassword.length);
    
    // Populate inputs with decrypted text for display (password remains masked by type="password")
    if (uEl && finalUsername) uEl.value = finalUsername;
    if (pEl && finalPassword && pEl.type !== "password") pEl.value = finalPassword;
  
    try {
      // ขอ salt จาก server สำหรับการเข้ารหัสครั้งนี้
      const saltResponse = await fetch("/getSalt");
      const { salt } = await saltResponse.json();
  
      // เข้ารหัสข้อมูลด้วย salt ที่ได้
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify({ username: finalUsername, password: finalPassword }),
        salt,
        {
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      ).toString();
  
      // console.log(encryptedData);
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: finalUsername,
          data: encryptedData,
          salt: salt
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
  
      if (result.success) {
        console.log("login successful")
        alert("เข้าสู่ระบบสำเร็จ");
        localStorage.setItem("token", result.token);
        location.reload();
      } else {
        console.log("login failed")
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
