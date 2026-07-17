export class LedgerAPI5xx extends Error {
  override name = "LedgerAPI5xx";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
