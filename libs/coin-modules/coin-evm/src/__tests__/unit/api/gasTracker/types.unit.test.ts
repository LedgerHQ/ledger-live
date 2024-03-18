import { isLedgerGasTracker } from "../../../../api/gasTracker/types";

describe("EVM Family", () => {
  describe("api/gasTracker/types.ts", () => {
    describe("type guards", () => {
      it("should narrow the param to a Ledger Gas Tracker type", () => {
        expect(isLedgerGasTracker({ type: "ledger", explorerId: "eth" })).toBe(true);
      });
    });
  });
});
