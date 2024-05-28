import crypto, { randomBytes } from "crypto";
import dotenv from "dotenv";

dotenv.config();

//generate initialization vector
function generateIV() {
    const iv = crypto.randomBytes(16);
    return iv;
}
 
export {generateIV};

//encrypt data
function encryptTokens(text, iv) {
    const algorithm = 'aes-256-cbc';
    const secretKey = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, 'hex');

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return encrypted.toString('hex');
}

export {encryptTokens};

//decrypt data
function decryptTokens(encryptedData, iv) {
    const algorithm = 'aes-256-cbc';
    const secretKey = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, 'hex');  // Load the secret key from .env and convert it from hex

    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));  // Convert the hex encoded data to a buffer
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}

export {decryptTokens};