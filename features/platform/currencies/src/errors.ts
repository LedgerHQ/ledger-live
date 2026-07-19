/**
 * Network / API error taxonomy thrown by the crypto-assets store builder when an
 * RTK-Query request fails.
 *
 * Native classes with stable `name`s mirroring the legacy `@ledgerhq/errors`
 * classes. `@ledgerhq/errors` is a frozen legacy lib the feature boundary forbids,
 * so the `name` string is the contract — prefer `error.name === "…"` over
 * `instanceof` (which breaks across process/serialization boundaries).
 */

export class NetworkDown extends Error {
  override name = "NetworkDown";
  constructor(message?: string) {
    super(message ?? "NetworkDown");
  }
}

export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
  constructor(message?: string) {
    super(message ?? "LedgerAPI4xx");
  }
}

export class LedgerAPI5xx extends Error {
  override name = "LedgerAPI5xx";
  constructor(message?: string) {
    super(message ?? "LedgerAPI5xx");
  }
}
