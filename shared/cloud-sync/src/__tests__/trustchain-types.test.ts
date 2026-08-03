import { TrustchainOutdated } from "../trustchain-types";

describe(TrustchainOutdated.name, () => {
  it("has the expected name and message", () => {
    const error = new TrustchainOutdated();
    expect(error.name).toBe("TrustchainOutdated");
    expect(error.message).toBe("Wallet sync data is outdated");
  });
});
