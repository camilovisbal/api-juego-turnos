import type { FieldErrors, RegisterBody } from "../types.js";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkName(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim().length < 2 || value.trim().length > 30) {
    return "El nombre debe tener entre 2 y 30 caracteres.";
  }
}

export function checkEmail(value: unknown): string | undefined {
  if (typeof value !== "string" || !EMAIL_PATTERN.test(value.trim())) {
    return "El correo no es válido.";
  }
}

export function checkPassword(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length < 6 || value.length > 50) {
    return "La contraseña debe tener entre 6 y 50 caracteres.";
  }
}

// Revisa el body del registro. Que el usuario o el correo ya existan lo revisa el controlador,
// porque necesita los datos del servidor.
export function validateRegister(body: RegisterBody) {
  const errors: FieldErrors = {};
  const { username, name, email, password } = body;

  if (typeof username !== "string" || !USERNAME_PATTERN.test(username.trim())) {
    errors.username = "El usuario debe tener entre 3 y 20 caracteres (letras, números o _).";
  }

  // El nombre es opcional: si no viene se usa el usuario.
  const nameError = name === undefined ? undefined : checkName(name);
  if (nameError) {
    errors.name = nameError;
  }

  const emailError = checkEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = checkPassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    username: typeof username === "string" ? username.trim() : "",
    name: typeof name === "string" ? name.trim() : undefined,
    email: typeof email === "string" ? email.trim().toLowerCase() : "",
    password: password as string,
  };
}
