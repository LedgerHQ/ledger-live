export class AddressesSanctionedError extends Error {
  override name = "AddressesSanctionedError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "AddressesSanctionedError");
    if (fields) Object.assign(this, fields);
  }
}
