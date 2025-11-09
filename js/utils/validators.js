// Input validation utilities
const validateFileName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required' };
  }
  
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Name cannot be empty' };
  }
  
  if (trimmed.length > 255) {
    return { isValid: false, error: 'Name is too long (max 255 characters)' };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(trimmed)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  
  // Check for reserved names (Windows)
  const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  if (reserved.test(trimmed)) {
    return { isValid: false, error: 'Name is reserved' };
  }
  
  return { isValid: true, sanitized: trimmed };
};
