export class WalletAuthError extends Error {
  override name = "WalletAuthError";
}

export class WalletAuthNoCredentialsError extends WalletAuthError {
  override name = "WalletAuthNoCredentialsError";

  constructor(broker: string) {
    super(`No credentials found for broker ${broker}`);
  }
}

export class WalletAuthInvalidChallengeError extends WalletAuthError {
  override name = "WalletAuthInvalidChallengeError";

  constructor() {
    super("Auth backend returned an invalid challenge");
  }
}

export class WalletAuthSignatureError extends WalletAuthError {
  override name = "WalletAuthSignatureError";

  constructor(cause: unknown) {
    super("Failed to sign auth challenge", { cause });
  }
}

export class WalletAuthInvalidAuthorizationError extends WalletAuthError {
  override name = "WalletAuthInvalidAuthorizationError";

  constructor() {
    super("Auth backend returned an invalid authorization response");
  }
}

export class WalletAuthInvalidTokenError extends WalletAuthError {
  override name = "WalletAuthInvalidTokenError";

  constructor() {
    super("Auth backend returned an invalid token response");
  }
}

export class WalletAuthHttpError extends WalletAuthError {
  override name = "WalletAuthHttpError";

  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}
