export class NetworkDown extends Error {
  override name = "NetworkDown";
  constructor(message?: string) {
    super(message ?? "NetworkDown");
  }
}

export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
  status?: number;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "LedgerAPI4xx");
    if (fields) Object.assign(this, fields);
  }
}

export class LedgerAPI5xx extends Error {
  override name = "LedgerAPI5xx";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "LedgerAPI5xx");
    if (fields) Object.assign(this, fields);
  }
}
