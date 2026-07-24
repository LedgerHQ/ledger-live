export class InvalidDomain extends Error {
  override name = "InvalidDomain";
}
export class DomainEmpty extends Error {
  override name = "DomainEmpty";
}
export class NoResolution extends Error {
  override name = "NoResolution";
}
export class UnsupportedDomainOrAddress extends Error {
  override name = "UnsupportedDomainOrAddress";
}
