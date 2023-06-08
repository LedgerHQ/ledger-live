import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { GasOptions } from "../../types";
import * as ledgerGasTracker from "./ledger";
import { getEnv, setEnv } from "@ledgerhq/live-env";

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

describe("EVM Family", () => {
  describe("gasTracker", () => {
    const originalEIP1559_BASE_FEE_MULTIPLIER: number = getEnv(
      "EIP1559_BASE_FEE_MULTIPLIER"
    );

    beforeAll(() => {
      setEnv("EIP1559_BASE_FEE_MULTIPLIER", 2);
    });
    afterAll(() => {
      setEnv(
        "EIP1559_BASE_FEE_MULTIPLIER",
        originalEIP1559_BASE_FEE_MULTIPLIER
      );
    });

    beforeEach(() => {
      jest
        .spyOn(ledgerGasTracker, "getGasTrackerBarometer")
        .mockImplementation(async () => ({
          low: new BigNumber(1),
          medium: new BigNumber(2),
          high: new BigNumber(3),
          next_base: new BigNumber(4),
        }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("ledger", () => {
      it("should return EIP-1559 gas options", async () => {
        jest
          .spyOn(ledgerGasTracker, "EIP1559ShouldBeUsed")
          .mockReturnValue(true);

        const gasOptions: GasOptions = await ledgerGasTracker.getGasOptions(
          fakeCurrency as CryptoCurrency
        );

        const expectedGasOptions: GasOptions = {
          slow: {
            maxFeePerGas: new BigNumber(9),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: null,
          },
          medium: {
            maxFeePerGas: new BigNumber(10),
            maxPriorityFeePerGas: new BigNumber(2),
            gasPrice: null,
          },
          fast: {
            maxFeePerGas: new BigNumber(11),
            maxPriorityFeePerGas: new BigNumber(3),
            gasPrice: null,
          },
        };

        expect(gasOptions).toEqual(expectedGasOptions);
      });

      it("should return legacy gas options", async () => {
        jest
          .spyOn(ledgerGasTracker, "EIP1559ShouldBeUsed")
          .mockReturnValue(false);

        const gasOptions: GasOptions = await ledgerGasTracker.getGasOptions(
          fakeCurrency as CryptoCurrency
        );

        const expectedGasOptions: GasOptions = {
          slow: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: new BigNumber(1),
          },
          medium: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: new BigNumber(2),
          },
          fast: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: new BigNumber(3),
          },
        };

        expect(gasOptions).toEqual(expectedGasOptions);
      });
    });
  });
});
