export class AuthenticatedBaseQueryMissingAuthSDKError extends Error {
  constructor() {
    super("Authenticated base query requires api.extra.authSDK");
    this.name = "AuthenticatedBaseQueryMissingAuthSDKError";
  }
}
