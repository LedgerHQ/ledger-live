import { WalletSyncOutdated } from "../trustchain-types";

describe(WalletSyncOutdated.name, () => {
  it("has the expected name and message", () => {
    const error = new WalletSyncOutdated();
    expect(error.name).toBe("WalletSyncOutdated");
    expect(error.message).toBe("Wallet sync data is outdated");
  });
});
