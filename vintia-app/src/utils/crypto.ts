// SHA-256 via Web Crypto API (disponible dans tous les navigateurs modernes)
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validation password : 8+ chars, 1 majuscule, 1 chiffre, 1 spécial
export function validatePassword(pw: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (pw.length < 8)           errors.push('Au moins 8 caractères');
  if (!/[A-Z]/.test(pw))       errors.push('Au moins une majuscule');
  if (!/[0-9]/.test(pw))       errors.push('Au moins un chiffre');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('Au moins un caractère spécial (!@#$%...)');
  return { ok: errors.length === 0, errors };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
