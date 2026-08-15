import { EvmConfigInfo } from "../../config";
import { getGasOptions as ledgerGetGasOptions } from "./ledger";
import { getGasTracker } from "./index";

const configWithGasTracker = {
  node: { type: "ledger", explorerId: "eth" },
  gasTracker: { type: "ledger", explorerId: "eth" },
} as unknown as EvmConfigInfo;

const configWithoutGasTracker = {
  node: { type: "ledger", explorerId: "eth" },
} as unknown as EvmConfigInfo;

describe("EVM Family", () => {
  describe("network/gasTracker/index.ts", () => {
    it("should return null if no gas tracker is found", () => {
      expect(getGasTracker(configWithoutGasTracker)).toBeNull();
    });

    it("should return a gas tracker for type 'ledger'", () => {
      expect(getGasTracker(configWithGasTracker)).toEqual({
        getGasOptions: ledgerGetGasOptions,
      });
    });
  });
});
