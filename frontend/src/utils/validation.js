export function validateName(name) {
  const v = (name || '').trim();
  if (v.length < 20 || v.length > 60) return 'Name must be 20–60 characters';
  return '';
}

export function validateAddress(address) {
  const v = (address || '').trim();
  if (!v) return 'Address is required';
  if (v.length > 400) return 'Address must be at most 400 characters';
  return '';
}

export function validateEmail(email) {
  const v = (email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
  return '';
}

export function validatePassword(password) {
  const v = password || '';
  if (v.length < 8 || v.length > 16) return 'Password must be 8–16 characters';
  if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(v)) {
    return 'Include at least one special character';
  }
  return '';
}

export function formatRating(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(1);
}
