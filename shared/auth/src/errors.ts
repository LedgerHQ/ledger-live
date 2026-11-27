export class AuthProviderMissingError extends Error {
  override name = "AuthProviderMissingError";

  constructor(key?: string) {
    super(
      key === undefined
        ? "The store has no auth middleware: add createAuthMiddleware"
        : `The store has no auth middleware for "${key}": add createAuthMiddleware with this key`,
    );
  }
}
