export class AuthProviderMissingError extends Error {
  override name = "AuthProviderMissingError";

  constructor() {
    super("Authenticated base query requires api.extra.authProvider");
  }
}
