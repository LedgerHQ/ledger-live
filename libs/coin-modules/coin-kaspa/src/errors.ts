export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
  constructor(message = "UnsupportedDerivation") {
    super(message);
  }
}

/** When a coin-module has no CoinConfig setted */
export class MissingCoinConfig extends Error {
  override name = "MissingCoinConfig";
  constructor(message = "MissingCoinConfig") {
    super(message);
  }
}
