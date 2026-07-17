export class NetworkDown extends Error {
  override name = "NetworkDown";
}

export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
  status?: number;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class LedgerAPI5xx extends Error {
  override name = "LedgerAPI5xx";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
