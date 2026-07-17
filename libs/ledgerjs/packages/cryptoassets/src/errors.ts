export class NetworkDown extends Error {
  override name = "NetworkDown";
}

export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
}

export class LedgerAPI5xx extends Error {
  override name = "LedgerAPI5xx";
}
