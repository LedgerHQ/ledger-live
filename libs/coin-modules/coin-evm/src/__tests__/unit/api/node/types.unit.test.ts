import { isExternalNodeConfig, isLedgerNodeConfig } from "../../../../network/node/types";

describe("EVM Family", () => {
  describe("network/node/types.ts", () => {
    describe("type guards", () => {
      it("should narrow the param to a Ledger Gas Tracker type", () => {
        expect(isLedgerNodeConfig({ type: "ledger", explorerId: "eth" })).toBe(true);
      });

      it("should narrow the param to an External Gas Tracker type", () => {
        expect(isExternalNodeConfig({ type: "external", uri: "anything" })).toBe(true);
      });
    });
  });
});
