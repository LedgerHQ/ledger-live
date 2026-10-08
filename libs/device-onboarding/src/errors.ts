export class CatalogueUnreachable extends Error {
  override name = "CatalogueUnreachable";

  constructor(cause?: unknown) {
    super("firmware catalogue is unreachable", cause === undefined ? undefined : { cause });
  }
}
