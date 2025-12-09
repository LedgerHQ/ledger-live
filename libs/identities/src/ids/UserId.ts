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

  exportUserIdForSegment(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForDisplay(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForWalletAPI(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForBraze(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForSentry(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForExportedLogs(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForRecoverRestoreStorageKey(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForChainwatch(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForFirmwareSalt(): string {
    return this[USER_ID_SYMBOL];
  }

  exportUserIdForSwapService(): string {
    return this[USER_ID_SYMBOL];
  }

  equals(other: UserId): boolean {
    return this[USER_ID_SYMBOL] === other[USER_ID_SYMBOL];
  }
}
