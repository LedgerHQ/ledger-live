import { isLedgerGasTracker } from "../../../../network/gasTracker/types";

describe("EVM Family", () => {
  describe("network/gasTracker/types.ts", () => {
    describe("type guards", () => {
      it("should narrow the param to a Ledger Gas Tracker type", () => {
        expect(isLedgerGasTracker({ type: "ledger", explorerId: "eth" })).toBe(true);
      });
    });
  });
});
