export class InvalidDomain extends Error {
  override name = "InvalidDomain";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidDomain");
    if (fields) Object.assign(this, fields);
  }
}
export class DomainEmpty extends Error {
  override name = "DomainEmpty";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "DomainEmpty");
    if (fields) Object.assign(this, fields);
  }
}
export class NoResolution extends Error {
  override name = "NoResolution";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NoResolution");
    if (fields) Object.assign(this, fields);
  }
}
export class UnsupportedDomainOrAddress extends Error {
  override name = "UnsupportedDomainOrAddress";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UnsupportedDomainOrAddress");
    if (fields) Object.assign(this, fields);
  }
}
