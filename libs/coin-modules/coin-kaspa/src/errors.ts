export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UnsupportedDerivation");
    if (fields) Object.assign(this, fields);
  }
}

/** When a coin-module has no CoinConfig setted */
export class MissingCoinConfig extends Error {
  override name = "MissingCoinConfig";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "MissingCoinConfig");
    if (fields) Object.assign(this, fields);
  }
}

export class DustLimit extends Error {
  override name = "DustLimit";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "DustLimit");
    if (fields) Object.assign(this, fields);
  }
}
