export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
  constructor(message?: string) {
    super(message || "UnsupportedDerivation");
  }
}

/** When a coin-module has no CoinConfig setted */
export class MissingCoinConfig extends Error {
  override name = "MissingCoinConfig";
  constructor(message?: string) {
    super(message || "MissingCoinConfig");
  }
}

export class DustLimit extends Error {
  override name = "DustLimit";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "DustLimit");
    if (fields) Object.assign(this, fields);
  }
}
