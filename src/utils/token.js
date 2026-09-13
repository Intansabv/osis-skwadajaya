import QRCode from 'qrcode';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes ambiguous chars like 0/O, 1/I for ease of student typing! But also accepts standard A-Z 0-9

/**
 * Generate a single cryptographically secure 6-character token
 * Strictly uppercase A-Z and digits 0-9
 */
export function generateRandomToken() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // high readability
  let result = '';
  const randomValues = new Uint8Array(6);
  window.crypto.getRandomValues(randomValues);

  for (let i = 0; i < 6; i++) {
    result += characters[randomValues[i] % characters.length];
  }
  return result;
}

/**
 * Generate multiple unique tokens
 */
export function generateMultipleTokens(count = 10, existingTokens = []) {
  const tokenSet = new Set(existingTokens.map((t) => t.toUpperCase()));
  const generated = [];

  while (generated.length < count) {
    const token = generateRandomToken();
    if (!tokenSet.has(token)) {
      tokenSet.add(token);
      generated.push(token);
    }
  }

  return generated;
}

/**
 * Format & sanitize user token input
 * Uppercase, alphanumeric only, max 6 characters
 */
export function formatTokenInput(rawInput = '') {
  if (!rawInput) return '';
  return rawInput
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

/**
 * Validate token format
 */
export function isValidTokenFormat(token = '') {
  if (!token) return false;
  const clean = token.toString().trim().toUpperCase();
  return clean.length === 6 && /^[A-Z0-9]{6}$/.test(clean);
}

/**
 * Generate QR Code as Data URL
 */
export async function generateQRCodeDataUrl(text, options = {}) {
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 200,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#0f4c81',
        light: options.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return null;
  }
}
