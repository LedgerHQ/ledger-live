export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "LedgerAPI4xx", options);
    if (fields) Object.assign(this, fields);
  }
}

export class LedgerAPI5xx extends Error {
  override name = "LedgerAPI5xx";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "LedgerAPI5xx", options);
    if (fields) Object.assign(this, fields);
  }
}

export class NetworkDown extends Error {
  override name = "NetworkDown";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "NetworkDown", options);
    if (fields) Object.assign(this, fields);
  }
}
