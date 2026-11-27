/**
 * Network / API error taxonomy thrown by the crypto-assets store builder when an
 * RTK-Query request fails.
 *
 * Native classes with stable `name`s: the `name` string is the contract — prefer
 * `error.name === "…"` over `instanceof` (which breaks across
 * process/serialization boundaries).
 */

export class NetworkDown extends Error {
  override name = "NetworkDown";
}

export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
  readonly status: number | undefined;

  constructor(status?: number) {
    super();
    this.status = status;
  }
}

export class LedgerAPI5xx extends Error {
  override name = "LedgerAPI5xx";
  readonly status: number | undefined;

  constructor(status?: number) {
    super();
    this.status = status;
  }
}
