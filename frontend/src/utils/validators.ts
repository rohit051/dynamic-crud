export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string) => {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter required");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter required");
  if (!/[0-9]/.test(password)) errors.push("One number required");
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("One special character required");
  return { valid: errors.length === 0, errors };
};

export const isValidPhone = (phone: string) => {
  // very small E.164 check: leading + and 7-15 digits
  return /^\+\d{7,15}$/.test(String(phone || "").trim());
};
