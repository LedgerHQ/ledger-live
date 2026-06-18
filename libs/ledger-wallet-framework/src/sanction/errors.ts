export class AddressesSanctionedError extends Error {
  override name = "AddressesSanctionedError";
  declare addresses: string[];
  constructor(message = "AddressesSanctionedError", fields?: { addresses: string[] }) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
