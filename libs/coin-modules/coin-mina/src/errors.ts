export class LedgerAPI5xx extends Error {
  override name = "LedgerAPI5xx";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "LedgerAPI5xx");
    if (fields) Object.assign(this, fields);
  }
}
