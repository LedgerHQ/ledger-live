import BigNumber from "bignumber.js";
import { AssertionError } from "assert";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { getGasOptions } from "../../../../api/gasTracker/ledger";
import { GasOptions } from "../../../../types";
import {
  GasTrackerDoesNotSupportEIP1559,
  LedgerGasTrackerUsedIncorrectly,
  NoGasTrackerFound,
} from "../../../../errors";

jest.mock("@ledgerhq/live-network/network");

const fakeCurrency: Partial<CryptoCurrency> = {
  id: "ethereum" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
    node: {
      type: "ledger",
      explorerId: "eth",
    },
    gasTracker: {
      type: "ledger",
      explorerId: "eth",
    },
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};

describe("EVM Family", () => {
  describe("api/gasTracker/index.ts", () => {
    const originalEIP1559_BASE_FEE_MULTIPLIER: number = getEnv("EIP1559_BASE_FEE_MULTIPLIER");

    beforeAll(() => {
      setEnv("EIP1559_BASE_FEE_MULTIPLIER", 2);
    });
    afterAll(() => {
      setEnv("EIP1559_BASE_FEE_MULTIPLIER", originalEIP1559_BASE_FEE_MULTIPLIER);
    });

    beforeEach(() => {
      const gastrackerBarometerMock = new Promise((resolve, _) => {
        resolve({
          data: {
            low: "1",
            medium: "2",
            high: "3",
            next_base: "4",
          },
        });
      });

      // @ts-expect-error method is mocked
      network.mockReturnValueOnce(gastrackerBarometerMock);
    });

    describe("ledger", () => {
      it("should return EIP-1559 gas options", async () => {
        const gasOptions: GasOptions = await getGasOptions({
          currency: fakeCurrency as CryptoCurrency,
          options: {
            useEIP1559: true,
          },
        });

        const expectedGasOptions: GasOptions = {
          slow: {
            maxFeePerGas: new BigNumber(9),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: null,
            nextBaseFee: new BigNumber(4),
          },
          medium: {
            maxFeePerGas: new BigNumber(10),
            maxPriorityFeePerGas: new BigNumber(2),
            gasPrice: null,
            nextBaseFee: new BigNumber(4),
          },
          fast: {
            maxFeePerGas: new BigNumber(11),
            maxPriorityFeePerGas: new BigNumber(3),
            gasPrice: null,
            nextBaseFee: new BigNumber(4),
          },
        };

        expect(gasOptions).toEqual(expectedGasOptions);
      });

      it("should return legacy gas options", async () => {
        const gasOptions: GasOptions = await getGasOptions({
          currency: fakeCurrency as CryptoCurrency,
          options: {
            useEIP1559: false,
          },
        });

        const expectedGasOptions: GasOptions = {
          slow: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: new BigNumber(1),
            nextBaseFee: null,
          },
          medium: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: new BigNumber(2),
            nextBaseFee: null,
          },
          fast: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: new BigNumber(3),
            nextBaseFee: null,
          },
        };

        expect(gasOptions).toEqual(expectedGasOptions);
      });

      it("should throw if the gas tracker type isn't ledger", async () => {
        try {
          await getGasOptions({
            currency: { ethereumLikeInfo: { gasTracker: { type: "wrong", uri: "anything" } } },
          } as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerGasTrackerUsedIncorrectly);
        }
      });

      it("should throw if the gas tracker explorerId doesn't exist", async () => {
        try {
          await getGasOptions({
            currency: {
              ethereumLikeInfo: { gasTracker: { type: "ledger", explorerId: "anything" } },
            },
          } as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(NoGasTrackerFound);
        }
      });

      it("should throw if the gas tracker tries to use EIP1559 when not supported", async () => {
        try {
          await getGasOptions({
            currency: {
              ethereumLikeInfo: { gasTracker: { type: "ledger", explorerId: "etc" } },
            },
            options: { useEIP1559: true },
          } as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(GasTrackerDoesNotSupportEIP1559);
        }
      });
    });
  });
});
