import {
  isEtherscanLikeExplorerConfig,
  isLedgerExplorerConfig,
} from "../../../../network/explorer/types";

describe("EVM Family", () => {
  describe("network/explorer/types.ts", () => {
    describe("type guards", () => {
      it("should narrow the param to a Ledger explorer type", () => {
        expect(isLedgerExplorerConfig({ type: "ledger", explorerId: "eth" })).toBe(true);
      });

      it("should narrow the param to an Etherscan-like explorer type", () => {
        expect(isEtherscanLikeExplorerConfig({ type: "etherscan", uri: "anything" })).toBe(true);
        expect(isEtherscanLikeExplorerConfig({ type: "blockscout", uri: "anything" })).toBe(true);
        expect(isEtherscanLikeExplorerConfig({ type: "teloscan", uri: "anything" })).toBe(true);
        expect(isEtherscanLikeExplorerConfig({ type: "klaytnfinder", uri: "anything" })).toBe(true);
      });
    });
  });
});
