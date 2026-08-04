export class AddressesSanctionedError extends Error {
  override name = "AddressesSanctionedError";
  addresses: string[];
  constructor(message?: string, fields?: { addresses: string[] }, options?: ErrorOptions) {
    super(message || "AddressesSanctionedError", options);
    this.addresses = fields?.addresses ?? [];
    if (fields) Object.assign(this, fields);
  }
}
