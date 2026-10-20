/** The device app has no such derivation mode: the scan skips the mode, as the legacy scan did. */
export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
}

export class UnknownDiscoveryCurrencyError extends Error {
  override name = "UnknownDiscoveryCurrencyError";
}
