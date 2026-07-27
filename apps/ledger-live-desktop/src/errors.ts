export class AccountNameRequiredError extends Error {
  override name = "AccountNameRequiredError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AccountNameRequiredError");
    if (fields) Object.assign(this, fields);
  }
}
