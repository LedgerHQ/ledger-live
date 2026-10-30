export class AssetsTablePortsMissing extends Error {
  override name = "AssetsTablePortsMissing";

  constructor() {
    super("AssetsTablePortsProvider is missing");
  }
}
