const DATADOG_ID_SYMBOL = Symbol("datadogId");

export class DatadogId {
  private readonly [DATADOG_ID_SYMBOL]: string;

  static fromString(id: string): DatadogId {
    return new DatadogId(id);
  }

  constructor(id: string) {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("DatadogId must be a non-empty string");
    }
    this[DATADOG_ID_SYMBOL] = id;
  }

  toString(): string {
    return "[DatadogId:REDACTED]";
  }

  toJSON(): string {
    return "[DatadogId:REDACTED]";
  }

  exportDatadogIdForPersistence(): string {
    return this[DATADOG_ID_SYMBOL];
  }

  exportDatadogIdForDatadog(): string {
    return this[DATADOG_ID_SYMBOL];
  }

  equals(other: DatadogId): boolean {
    return this[DATADOG_ID_SYMBOL] === other[DATADOG_ID_SYMBOL];
  }
}
