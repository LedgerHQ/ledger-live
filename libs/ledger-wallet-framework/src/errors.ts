export class UnsupportedDerivation extends Error {
  override name = "UnsupportedDerivation";
  constructor(message = "UnsupportedDerivation") {
    super(message);
  }
}
