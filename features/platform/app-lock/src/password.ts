export const PASSWORD_MIN_LENGTH = 6;

// A cap, not a rule: deriving a digest is deliberately slow, so a pasted novel would cost seconds.
export const PASSWORD_MAX_LENGTH = 128;

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}
