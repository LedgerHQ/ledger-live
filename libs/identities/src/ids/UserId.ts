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

  equals(other: UserId): boolean {
    return this[USER_ID_SYMBOL] === other[USER_ID_SYMBOL];
  }
}
