export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
}

/** When a coin-module has no CoinConfig setted */
export class MissingCoinConfig extends Error {
  override name = "MissingCoinConfig";
}

export class DustLimit extends Error {
  override name = "DustLimit";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
