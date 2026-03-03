const USER_ID_SYMBOL = Symbol("userId");

export class UserId {
  private readonly [USER_ID_SYMBOL]: string;

  static fromString(id: string): UserId {
    return new UserId(id);
  }

  constructor(id: string) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("UserId must be a non-empty string");
    }
    this[USER_ID_SYMBOL] = id;
  }

  toString(): string {
    return "[UserId:REDACTED]";
  }

  toJSON(): string {
    return "[UserId:REDACTED]";
  }

  exportUserIdForPushDevicesService(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForPersistence(): string {
    return this[USER_ID_SYMBOL];
  }

  /** For Segment and analytics display (live-common-setup USER_ID, segment, Developer). Allowlisted in export-rules.json. */
  exportUserIdForAnalytics(): string {
    return this[USER_ID_SYMBOL];
  }

  /** For Braze changeUser. Allowlisted in export-rules.json. */
  exportUserIdForBraze(): string {
    return this[USER_ID_SYMBOL];
  }

  /** For Recover restore onboarding store key. Allowlisted in export-rules.json. */
  exportUserIdForRecover(): string {
    return this[USER_ID_SYMBOL];
  }

  /** For Wallet API (Web3 dapps). Allowlisted in export-rules.json. */
  exportUserIdForWalletAPI(): string {
    return this[USER_ID_SYMBOL];
  }

  /** For user-facing logs export (e.g. export logs button). Allowlisted in export-rules.json. */
  exportUserIdForUserLogs(): string {
    return this[USER_ID_SYMBOL];
  }

  equals(other: UserId): boolean {
    return this[USER_ID_SYMBOL] === other[USER_ID_SYMBOL];
  }
}
