const { crypto } = require('crypto').webcrypto;

async function testECDH() {
  const keys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  try {
    const sharedKey = await crypto.subtle.deriveKey(
      { name: "ECDH", public: keys.publicKey },
      keys.privateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    console.log("Success", sharedKey);
  } catch (e) {
    console.error("Error", e);
  }
}

testECDH();
