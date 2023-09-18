require('dotenv').config();

function hexstringToUint8Array(hexstring) {
  if (hexstring.startsWith('0x')) {
    hexstring = hexstring.slice(2);
  }
  const uint8Array = new Uint8Array(hexstring.length / 2);
  for (let i = 0; i < uint8Array.length; i++) {
    uint8Array[i] = parseInt(hexstring.slice(i * 2, i * 2 + 2), 16);
  }
  return uint8Array;
}

const salt = process.env.SALT
console.log(hexstringToUint8Array(salt))

console.log(parseInt('0x5555'))
console.log(parseInt(salt))