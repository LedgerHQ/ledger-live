import type { PasswordVerifier, ScryptParams } from "./types";

export const PASSWORD_VERIFIER_VERSION = 1;

export function createPasswordVerifier(
  input: Readonly<{ digest: Uint8Array; salt: Uint8Array; scrypt: ScryptParams }>,
): PasswordVerifier {
  return {
    version: PASSWORD_VERIFIER_VERSION,
    scrypt: input.scrypt,
    salt: Uint8Array.from(input.salt),
    digest: Uint8Array.from(input.digest),
  };
}

/** Compares in constant time: no `===`, no early exit, or the timing leaks the digest. */
export function matchesPasswordVerifier(verifier: PasswordVerifier, digest: Uint8Array): boolean {
  if (digest.length !== verifier.digest.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < digest.length; index += 1) {
    difference |= digest[index] ^ verifier.digest[index];
  }

  return difference === 0;
}
