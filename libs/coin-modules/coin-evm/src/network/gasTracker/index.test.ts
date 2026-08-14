import type { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/ledger-wallet-framework/types";
import { EvmConfigInfo } from "../../config";
import { getGasOptions as ledgerGetGasOptions } from "./ledger";
import { getGasTracker } from "./index";

const fakeCurrency: Partial<CryptoCurrency> = {
  id: "my_new_chain" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};

const fakeCurrencyWithoutGasTracker: Partial<CryptoCurrency> = {
  id: "no_gas_tracker" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};

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
      expect(
        getGasTracker(configWithoutGasTracker, fakeCurrencyWithoutGasTracker as CryptoCurrency),
      ).toBeNull();
    });

    it("should return a gas tracker for type 'ledger'", () => {
      expect(getGasTracker(configWithGasTracker, fakeCurrency as CryptoCurrency)).toEqual({
        getGasOptions: ledgerGetGasOptions,
      });
    });
  });
});
