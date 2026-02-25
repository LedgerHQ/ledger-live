import { supportedFeatures } from "./supportedFeatures";

describe("supportedFeatures", () => {
  it("should be defined", () => {
    expect(supportedFeatures).not.toBeUndefined();
  });

  it("should have blockchain_txs property", () => {
    expect(supportedFeatures).toHaveProperty("blockchain_txs");
  });

  it("should include 'send' in blockchain_txs", () => {
    expect(supportedFeatures.blockchain_txs).toContain("send");
  });

  it("should have blockchain_txs as an array", () => {
    expect(Array.isArray(supportedFeatures.blockchain_txs)).toBe(true);
  });

  it("should have exactly one item in blockchain_txs", () => {
    expect(supportedFeatures.blockchain_txs).toHaveLength(1);
  });
});
