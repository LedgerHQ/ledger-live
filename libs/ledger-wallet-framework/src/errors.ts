export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
  constructor(message?: string, fields?: Record<string, unknown>, options?: ErrorOptions) {
    super(message || "UnsupportedDerivation", options);
    if (fields) Object.assign(this, fields);
  }
}
