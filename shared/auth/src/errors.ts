export class AuthProviderMissingError extends Error {
  override name = "AuthProviderMissingError";

  constructor() {
    super("Authenticated base query requires api.extra.authProvider");
  }
}

export class AuthProviderUnavailableError extends Error {
  override name = "AuthProviderUnavailableError";

  constructor() {
    super("Authentication is enabled but no auth provider is available");
  }
}
