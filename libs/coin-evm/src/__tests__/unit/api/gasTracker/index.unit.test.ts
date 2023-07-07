import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { getGasTracker } from "../../../../api/gasTracker";
import { getGasOptions as ledgerGetGasOptions } from "../../../../api/gasTracker/ledger";

const fakeCurrency: Partial<CryptoCurrency> = {
  id: "my_new_chain" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
    gasTracker: {
      type: "ledger",
      uri: "my-gas-tracker.com",
    },
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};
const fakeCurrencyWithoutGasTracker: Partial<CryptoCurrency> = {
  id: "my_new_chain" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};

describe("EVM Family", () => {
  describe("api/gasTracker/index.ts", () => {
    it("should return null if no gas tracker is found", () => {
      expect(getGasTracker(fakeCurrencyWithoutGasTracker as CryptoCurrency)).toBeNull();
    });

    it("should return a gas tracker for type 'ledger'", () => {
      expect(getGasTracker(fakeCurrency as CryptoCurrency)).toEqual({
        getGasOptions: ledgerGetGasOptions,
      });
    });
  });
});
