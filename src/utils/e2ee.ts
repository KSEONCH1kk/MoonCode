/**
 * End-to-End Encryption Module
 * Simple RSA-OAEP implementation for message encryption
 * With password-based private key encryption for cross-device sync
 */

// ============================================================================
// Types
// ============================================================================

export interface EncryptedMessage {
  encrypted: string; // Base64 encoded encrypted data
}

export interface EncryptedPrivateKey {
  encryptedKey: string; // Base64 encoded encrypted private key
  salt: string; // Base64 encoded salt for PBKDF2
  iv: string; // Base64 encoded IV for AES-GCM
}

// ============================================================================
// Key Generation & Management
// ============================================================================

/**
 * Generate a new RSA key pair (2048 bits)
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  console.log('[E2EE] Generating new RSA key pair (2048 bits)...')
  
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
  
  console.log('[E2EE] Key pair generated successfully')
  return keyPair
}

/**
 * Export public key to base64 string
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key)
  const base64 = arrayBufferToBase64(exported)
  return base64
}

/**
 * Export private key to base64 string
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', key)
  const base64 = arrayBufferToBase64(exported)
  return base64
}

/**
 * Validate that a base64 string looks like a valid RSA public key (SPKI)
 */
function validatePublicKeyFormat(base64Key: string): boolean {
  try {
    const buffer = base64ToArrayBuffer(base64Key)
    const bytes = new Uint8Array(buffer)
    // SPKI public key should start with 0x30 (SEQUENCE)
    if (bytes.length < 4) return false
    if (bytes[0] !== 0x30) return false // SEQUENCE tag
    return true
  } catch {
    return false
  }
}

/**
 * Import public key from base64 string
 */
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  // Validate format first
  if (!validatePublicKeyFormat(base64Key)) {
    throw new Error('Invalid public key format - does not appear to be a valid SPKI RSA key')
  }
  
  const buffer = base64ToArrayBuffer(base64Key)
  
  try {
    const key = await crypto.subtle.importKey(
      'spki',
      buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    )
    
    return key
  } catch (error: any) {
    console.error('[E2EE] Failed to import public key:', error)
    throw new Error(`Failed to import public key: ${error?.message || 'Invalid key format'}`)
  }
}

/**
 * Validate that a base64 string looks like a valid RSA private key (PKCS#8)
 */
function validatePrivateKeyFormat(base64Key: string): boolean {
  try {
    const buffer = base64ToArrayBuffer(base64Key)
    // PKCS#8 private key should start with specific bytes
    const bytes = new Uint8Array(buffer)
    // Check for PKCS#8 structure: 0x30 0x82 (SEQUENCE, length)
    if (bytes.length < 4) return false
    if (bytes[0] !== 0x30) return false // SEQUENCE tag
    return true
  } catch {
    return false
  }
}

/**
 * Import private key from base64 string
 */
export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  // Validate format first
  if (!validatePrivateKeyFormat(base64Key)) {
    throw new Error('Invalid private key format - does not appear to be a valid PKCS#8 RSA key')
  }
  
  const buffer = base64ToArrayBuffer(base64Key)
  
  try {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    )
    
    return key
  } catch (error: any) {
    console.error('[E2EE] Failed to import private key:', error)
    throw new Error(`Failed to import private key: ${error?.message || 'Invalid key format'}`)
  }
}

// ============================================================================
// Password-based Private Key Encryption (for cross-device sync)
// ============================================================================

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveMasterKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  // Derive AES key from password
  const masterKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  
  return masterKey
}

/**
 * Encrypt private key with password (for storing on server)
 */
export async function encryptPrivateKeyWithPassword(
  privateKeyBase64: string,
  password: string
): Promise<EncryptedPrivateKey> {
  console.log('[E2EE] Encrypting private key with password')
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // Derive master key from password
  const masterKey = await deriveMasterKeyFromPassword(password, salt)
  
  // Encrypt private key
  const encoder = new TextEncoder()
  const privateKeyBytes = encoder.encode(privateKeyBase64)
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    masterKey,
    privateKeyBytes
  )
  
  console.log('[E2EE] Private key encrypted successfully')
  
  return {
    encryptedKey: arrayBufferToBase64(encryptedBuffer),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
  }
}

/**
 * Decrypt private key with password (when loading from server)
 */
export async function decryptPrivateKeyWithPassword(
  encryptedData: EncryptedPrivateKey,
  password: string
): Promise<string> {
  console.log('[E2EE] Decrypting private key with password')
  
  try {
    // Convert from base64
    const encryptedBuffer = base64ToArrayBuffer(encryptedData.encryptedKey)
    const salt = base64ToArrayBuffer(encryptedData.salt)
    const iv = base64ToArrayBuffer(encryptedData.iv)
    
    // Derive master key from password
    const masterKey = await deriveMasterKeyFromPassword(password, new Uint8Array(salt) as Uint8Array)
    
    // Decrypt private key
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) as BufferSource },
      masterKey,
      encryptedBuffer
    )
    
    const decoder = new TextDecoder()
    const privateKey = decoder.decode(decryptedBuffer)
    
    console.log('[E2EE] Private key decrypted successfully')
    return privateKey
  } catch (error) {
    console.error('[E2EE] Failed to decrypt private key:', error)
    throw new Error('Failed to decrypt private key - wrong password or corrupted data')
  }
}

// ============================================================================
// LocalStorage Management
// ============================================================================

const STORAGE_PREFIX = 'e2ee_'

function getStorageKey(userId: string, type: 'public' | 'private'): string {
  return `${STORAGE_PREFIX}${type}_${userId}`
}

/**
 * Store public key in localStorage
 */
export function storePublicKeyLocal(userId: string, publicKey: string): void {
  const key = getStorageKey(userId, 'public')
  localStorage.setItem(key, publicKey)
  console.log(`[E2EE] Public key stored locally for user ${userId}`)
}

/**
 * Get public key from localStorage
 */
export function getPublicKeyLocal(userId: string): string | null {
  const key = getStorageKey(userId, 'public')
  return localStorage.getItem(key)
}

/**
 * Store private key in localStorage
 */
export function storePrivateKeyLocal(userId: string, privateKey: string): void {
  const key = getStorageKey(userId, 'private')
  localStorage.setItem(key, privateKey)
  console.log(`[E2EE] Private key stored locally for user ${userId}`)
}

/**
 * Get private key from localStorage
 */
export function getPrivateKeyLocal(userId: string): string | null {
  const key = getStorageKey(userId, 'private')
  return localStorage.getItem(key)
}

/**
 * Store recipient's public key in localStorage (for caching)
 */
export function storeRecipientPublicKeyLocal(recipientId: string, publicKey: string): void {
  const key = `${STORAGE_PREFIX}recipient_${recipientId}`
  localStorage.setItem(key, publicKey)
  console.log(`[E2EE] Recipient public key cached for ${recipientId}`)
}

/**
 * Get recipient's public key from localStorage
 */
export function getRecipientPublicKeyLocal(recipientId: string): string | null {
  const key = `${STORAGE_PREFIX}recipient_${recipientId}`
  return localStorage.getItem(key)
}

/**
 * Clear all E2EE data from localStorage
 */
export function clearAllE2EEData(): void {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key)
    }
  })
  console.log('[E2EE] All E2EE data cleared from localStorage')
}

// ============================================================================
// Key Validation
// ============================================================================

/**
 * Verify that a private key matches a public key by encrypting/decrypting test data
 */
export async function verifyKeyPair(publicKeyBase64: string, privateKeyBase64: string): Promise<boolean> {
  try {
    const testMessage = 'test'
    const encrypted = await encryptMessage(testMessage, publicKeyBase64)
    const decrypted = await decryptMessage(encrypted, privateKeyBase64)
    return decrypted === testMessage
  } catch (error) {
    console.error('[E2EE] Key pair verification failed:', error)
    return false
  }
}

// ============================================================================
// Encryption & Decryption
// ============================================================================

/**
 * Encrypt a message using recipient's public key
 */
export async function encryptMessage(
  message: string,
  recipientPublicKeyBase64: string
): Promise<EncryptedMessage> {
  console.log(`[E2EE] Encrypting message (${message.length} chars)`)
  console.log(`[E2EE] Recipient public key length: ${recipientPublicKeyBase64.length}, first 50 chars: ${recipientPublicKeyBase64.substring(0, 50)}`)
  
  try {
    // Import recipient's public key
    const publicKey = await importPublicKey(recipientPublicKeyBase64)
    console.log(`[E2EE] Public key imported successfully`)
    
    // Convert message to bytes
    const messageBytes = new TextEncoder().encode(message)
    console.log(`[E2EE] Message bytes length: ${messageBytes.length} bytes`)
    
    // Check message size (RSA-OAEP 2048 can encrypt max ~190 bytes)
    if (messageBytes.length > 190) {
      throw new Error(`Message too long for RSA-OAEP 2048 (${messageBytes.length} bytes, max 190)`)
    }
    
    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      messageBytes
    )
    
    console.log(`[E2EE] Encrypted buffer length: ${encryptedBuffer.byteLength} bytes`)
    
    // Convert to base64
    const encrypted = arrayBufferToBase64(encryptedBuffer)
    
    console.log(`[E2EE] Message encrypted successfully (${encrypted.length} chars)`)
    
    return { encrypted }
  } catch (error: any) {
    console.error('[E2EE] Encryption failed:', error)
    console.error('[E2EE] Error name:', error?.name)
    console.error('[E2EE] Error message:', error?.message)
    throw new Error(`Failed to encrypt message: ${error?.message || 'Unknown error'}`)
  }
}

/**
 * Decrypt a message using own private key
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessage,
  privateKeyBase64: string
): Promise<string> {
  console.log(`[E2EE] Decrypting message`)
  console.log(`[E2EE] Encrypted data length: ${encryptedMessage.encrypted.length}`)
  console.log(`[E2EE] Private key length: ${privateKeyBase64.length}, first 50 chars: ${privateKeyBase64.substring(0, 50)}`)
  
  try {
    // Validate private key format
    if (!validatePrivateKeyFormat(privateKeyBase64)) {
      throw new Error('Invalid private key format - key may be corrupted or in wrong format')
    }
    
    // Import private key
    const privateKey = await importPrivateKey(privateKeyBase64)
    console.log(`[E2EE] Private key imported successfully`)
    
    // Convert base64 to buffer
    const encryptedBuffer = base64ToArrayBuffer(encryptedMessage.encrypted)
    console.log(`[E2EE] Encrypted buffer length: ${encryptedBuffer.byteLength} bytes`)
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedBuffer
    )
    
    console.log(`[E2EE] Decrypted buffer length: ${decryptedBuffer.byteLength} bytes`)
    
    // Convert to string
    const decrypted = new TextDecoder().decode(decryptedBuffer)
    
    console.log(`[E2EE] Message decrypted successfully (${decrypted.length} chars)`)
    
    return decrypted
  } catch (error: any) {
    console.error('[E2EE] Decryption failed:', error)
    console.error('[E2EE] Error name:', error?.name)
    console.error('[E2EE] Error message:', error?.message)
    console.error('[E2EE] Error stack:', error?.stack)
    
    // Provide more specific error messages
    if (error?.name === 'DataError') {
      throw new Error('Failed to decrypt message: The private key does not match the public key used for encryption, or the encrypted data is corrupted')
    } else if (error?.message?.includes('Invalid private key format')) {
      throw new Error('Failed to decrypt message: Private key is corrupted or in wrong format')
    } else {
      throw new Error(`Failed to decrypt message: ${error?.message || 'Unknown error'}`)
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// ============================================================================
// Backward Compatibility (old function names)
// ============================================================================

export const storePrivateKey = storePrivateKeyLocal
export const getStoredPrivateKey = getPrivateKeyLocal
export const storePublicKey = storePublicKeyLocal
export const getStoredPublicKey = getPublicKeyLocal
export const storeRecipientPublicKey = storeRecipientPublicKeyLocal
export const getRecipientPublicKey = getRecipientPublicKeyLocal
