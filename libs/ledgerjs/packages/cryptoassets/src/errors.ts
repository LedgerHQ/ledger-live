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
