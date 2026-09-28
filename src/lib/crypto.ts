// src/lib/crypto.ts

// 1. Dicionário de Alfabeto Customizado (Símbolos de Teclado)
const mapNormalToCode: Record<string, string> = {
  'A': '!', 'B': '@', 'C': '#', 'D': '$', 'E': '%', 'F': '^', 'G': '&', 'H': '*', 'I': '(', 'J': ')', 
  'K': '-', 'L': '_', 'M': '=', 'N': '+', 'O': '[', 'P': '{', 'Q': ']', 'R': '}', 'S': '\\', 'T': '|', 
  'U': ';', 'V': ':', 'W': '\'', 'X': '"', 'Y': ',', 'Z': '.',
  'a': '!', 'b': '@', 'c': '#', 'd': '$', 'e': '%', 'f': '^', 'g': '&', 'h': '*', 'i': '(', 'j': ')', 
  'k': '-', 'l': '_', 'm': '=', 'n': '+', 'o': '[', 'p': '{', 'q': ']', 'r': '}', 's': '\\', 't': '|', 
  'u': ';', 'v': ':', 'w': '\'', 'x': '"', 'y': ',', 'z': '.',
  ' ': '~', '0': '9', '1': '8', '2': '7', '3': '6', '4': '5', '5': '4', '6': '3', '7': '2', '8': '1', '9': '0'
};

const mapCodeToNormal: Record<string, string> = {};
for (const [key, value] of Object.entries(mapNormalToCode)) {
  if (key === key.toUpperCase() || key === ' ' || !isNaN(Number(key))) {
    mapCodeToNormal[value] = key;
  }
}

export const visualCipher = {
  encode: (text: string) => {
    return text.split('').map(char => mapNormalToCode[char] || char).join('');
  },
  decode: (text: string) => {
    return text.split('').map(char => mapCodeToNormal[char] || char).join('');
  }
};

// 2. Criptografia de Ponta a Ponta (E2EE) usando Web Crypto API (ECDH + AES-GCM)
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );
}

export async function exportPublicKey(publicKey: CryptoKey) {
  const exported = await window.crypto.subtle.exportKey("raw", publicKey);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  return window.btoa(exportedAsString);
}

export async function exportPrivateKey(privateKey: CryptoKey) {
  const exported = await window.crypto.subtle.exportKey("jwk", privateKey);
  return window.btoa(JSON.stringify(exported));
}

export async function importPrivateKey(base64Key: string) {
  const jwk = JSON.parse(window.atob(base64Key));
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

export async function importPublicKey(base64Key: string) {
  const binaryString = window.atob(base64Key);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    "raw",
    bytes,
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    []
  );
}

// Deriva a chave AES-GCM compartilhada
async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// Criptografa a mensagem para o destinatário
export async function encryptMessage(message: string, privateKey: CryptoKey, recipientPublicKeyBase64: string) {
  const recipientPublicKey = await importPublicKey(recipientPublicKeyBase64);
  const sharedKey = await deriveSharedKey(privateKey, recipientPublicKey);
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = new TextEncoder().encode(message);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    sharedKey,
    encodedMessage
  );

  const ivBase64 = window.btoa(String.fromCharCode.apply(null, Array.from(iv)));
  const ciphertextBase64 = window.btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(ciphertext))));

  // O pacote enviado será um JSON transformado em string, parecendo um código
  return JSON.stringify({ iv: ivBase64, ciphertext: ciphertextBase64 });
}

// Descriptografa a mensagem recebida
export async function decryptMessage(encryptedPayload: string, privateKey: CryptoKey, senderPublicKeyBase64: string) {
  const senderPublicKey = await importPublicKey(senderPublicKeyBase64);
  const sharedKey = await deriveSharedKey(privateKey, senderPublicKey);

  const payload = JSON.parse(encryptedPayload);
  
  const ivStr = window.atob(payload.iv);
  const iv = new Uint8Array(ivStr.length);
  for(let i=0; i<ivStr.length; i++) iv[i] = ivStr.charCodeAt(i);

  const ctStr = window.atob(payload.ciphertext);
  const ciphertext = new Uint8Array(ctStr.length);
  for(let i=0; i<ctStr.length; i++) ciphertext[i] = ctStr.charCodeAt(i);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    sharedKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
