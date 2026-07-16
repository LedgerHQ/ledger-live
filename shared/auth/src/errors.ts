export class AuthenticatedBaseQueryMissingAuthSDKError extends Error {
  override name = "AuthenticatedBaseQueryMissingAuthSDKError";

  constructor() {
    super("Authenticated base query requires api.extra.authSDK");
  }
}
