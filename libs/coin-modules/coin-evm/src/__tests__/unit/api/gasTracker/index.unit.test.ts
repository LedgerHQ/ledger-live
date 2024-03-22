import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { getGasTracker } from "../../../../api/gasTracker";
import { getGasOptions as ledgerGetGasOptions } from "../../../../api/gasTracker/ledger";
import { getCoinConfig } from "../../../../config";

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

jest.mock("../../../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

mockGetConfig.mockImplementation((currency: { id: string }): any => {
  switch (currency.id) {
    case "my_new_chain": {
      return {
        info: {
          node: {
            type: "ledger",
            explorerId: "eth",
          },
          gasTracker: {
            type: "ledger",
            explorerId: "eth",
          },
        },
      };
    }
    case "no_gas_tracker": {
      return {
        info: {
          node: {
            type: "ledger",
            explorerId: "eth",
          },
        },
      };
    }
  }
});

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
