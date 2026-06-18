export class InvalidDomain extends Error {
  override name = "InvalidDomain";
  constructor(message = "InvalidDomain") {
    super(message);
  }
}
export class DomainEmpty extends Error {
  override name = "DomainEmpty";
  constructor(message = "DomainEmpty") {
    super(message);
  }
}
export class NoResolution extends Error {
  override name = "NoResolution";
  constructor(message = "NoResolution") {
    super(message);
  }
}
export class UnsupportedDomainOrAddress extends Error {
  override name = "UnsupportedDomainOrAddress";
  constructor(message = "UnsupportedDomainOrAddress") {
    super(message);
  }
}
