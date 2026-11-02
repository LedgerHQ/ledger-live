export class AuthProviderMissingError extends Error {
  override name = "AuthProviderMissingError";

  constructor() {
    super("The store has no auth middleware: add createAuthMiddleware");
  }
}
