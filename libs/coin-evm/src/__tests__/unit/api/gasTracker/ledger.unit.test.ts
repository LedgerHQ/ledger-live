import network from "@ledgerhq/live-network/network";
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { GasOptions } from "../../../../types";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { getGasOptions } from "../../../../api/gasTracker/ledger";
jest.mock("@ledgerhq/live-network/network");

const fakeCurrency: Partial<CryptoCurrency> = {
  id: "ethereum" as CryptoCurrencyId,
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
