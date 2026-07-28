import { supportedFeatures } from "./supportedFeatures";

describe("supportedFeatures", () => {
  it("exports blockchain_txs as a non-empty array", () => {
    expect(supportedFeatures.blockchain_txs).toBeInstanceOf(Array);
    expect(supportedFeatures.blockchain_txs.length).toBeGreaterThan(0);
  });
});
