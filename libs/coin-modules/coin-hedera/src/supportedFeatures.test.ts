import { supportedFeatures } from "./supportedFeatures";

describe("supportedFeatures", () => {
  it("exports blockchain_txs as a non-empty array", () => {
    const blockchainTxs = supportedFeatures.blockchain_txs ?? [];
    expect(blockchainTxs).toBeInstanceOf(Array);
    expect(blockchainTxs.length).toBeGreaterThan(0);
  });
});
