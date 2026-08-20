import { supportedFeatures } from "./supportedFeatures";

describe("supportedFeatures", () => {
  it("exports blockchain_txs as a non-empty array", () => {
    const blockchainTxs = supportedFeatures.blockchain_txs ?? [];
    expect(blockchainTxs).toBeInstanceOf(Array);
    expect(blockchainTxs.length).toBeGreaterThan(0);
  });

  it("declares the four staking modes validateIntent/craftTransaction implement", () => {
    expect(supportedFeatures.staking_txs).toEqual([
      "delegate",
      "undelegate",
      "redelegate",
      "claimReward",
    ]);
  });
});
