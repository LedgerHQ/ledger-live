export class AppLockError extends Error {
  override name: string = "AppLockError";
}

export class WrongPassword extends AppLockError {
  override name = "WrongPassword" as const;

  constructor() {
    super("The supplied password does not match the stored verifier");
  }
}

export class PasswordNotSet extends AppLockError {
  override name = "PasswordNotSet" as const;

  constructor() {
    super("No password verifier has been stored yet");
  }
}
