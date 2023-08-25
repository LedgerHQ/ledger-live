import { getEnv, setEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { AssertionError } from "assert";
import BigNumber from "bignumber.js";
import { getGasOptions } from "../../../../api/gasTracker/ledger";
import { LedgerGasTrackerUsedIncorrectly, NoGasTrackerFound } from "../../../../errors";
import { GasOptions, Strategy } from "../../../../types";

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

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

const TEST_EIP1559_BASE_FEE_MULTIPLIER = 2;

describe("EVM Family", () => {
  describe("api/gasTracker/index.ts", () => {
    const originalEIP1559_BASE_FEE_MULTIPLIER: number = getEnv("EIP1559_BASE_FEE_MULTIPLIER");

    beforeAll(() => {
      setEnv("EIP1559_BASE_FEE_MULTIPLIER", TEST_EIP1559_BASE_FEE_MULTIPLIER);
    });
    afterAll(() => {
      setEnv("EIP1559_BASE_FEE_MULTIPLIER", originalEIP1559_BASE_FEE_MULTIPLIER);
    });

    beforeEach(() => {
      const gastrackerBarometerMock: any = new Promise((resolve, _) => {
        resolve({
          data: {
            low: "1",
            medium: "2",
            high: "3",
            next_base: "4",
          },
        });
      });

      mockedNetwork.mockReturnValueOnce(gastrackerBarometerMock);
    });

    describe("ledger", () => {
      describe("EIP-1559 gas options", () => {
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

        it("should return integer values when EIP1559_BASE_FEE_MULTIPLIER is a float", async () => {
          setEnv("EIP1559_BASE_FEE_MULTIPLIER", 1.5);

          mockedNetwork.mockReset();

          const gastrackerBarometerMock: any = new Promise((resolve, _) => {
            resolve({
              data: {
                low: "1",
                medium: "2",
                high: "3",
                next_base: "3",
              },
            });
          });

          mockedNetwork.mockReturnValueOnce(gastrackerBarometerMock);

          const gasOptions: GasOptions = await getGasOptions({
            currency: fakeCurrency as CryptoCurrency,
            options: {
              useEIP1559: true,
            },
          });

          Object.keys(gasOptions).forEach(key => {
            const strategy = key as Strategy;

            const { maxFeePerGas } = gasOptions[strategy];

            expect(maxFeePerGas?.isInteger(), `${key}:maxFeePerGas - got ${maxFeePerGas}`).toBe(
              true,
            );
          });

          setEnv("EIP1559_BASE_FEE_MULTIPLIER", TEST_EIP1559_BASE_FEE_MULTIPLIER);
        });

        it("should return interger values when API return floats", async () => {
          mockedNetwork.mockReset();

          const gastrackerBarometerMock: any = new Promise((resolve, _) => {
            resolve({
              data: {
                low: "1.5",
                medium: "2.4",
                high: "3.7",
                next_base: "3.8",
              },
            });
          });

          mockedNetwork.mockReturnValueOnce(gastrackerBarometerMock);

          const gasOptions: GasOptions = await getGasOptions({
            currency: fakeCurrency as CryptoCurrency,
            options: {
              useEIP1559: true,
            },
          });

          Object.keys(gasOptions).forEach(key => {
            const strategy = key as Strategy;

            const feeData = gasOptions[strategy];

            const { maxFeePerGas, maxPriorityFeePerGas, nextBaseFee } = feeData;

            expect(maxFeePerGas?.isInteger(), `${key}:maxFeePerGas - got ${maxFeePerGas}`).toBe(
              true,
            );
            expect(
              maxPriorityFeePerGas?.isInteger(),
              `${key}:maxPriorityFeePerGas - got ${maxPriorityFeePerGas}`,
            ).toBe(true);
            expect(nextBaseFee?.isInteger(), `${key}:nextBaseFee - got ${nextBaseFee}`).toBe(true);
          });
        });
      });

      describe("legacy gas options", () => {
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

        it("should return legacy gas options when EIP-1559 not supported by currency", async () => {
          const gasOptions: GasOptions = await getGasOptions({
            currency: {
              ethereumLikeInfo: { gasTracker: { type: "ledger", explorerId: "etc" } },
            },
            options: { useEIP1559: true },
          } as any);

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

        it("should return interger values when API return floats", async () => {
          mockedNetwork.mockReset();

          const gastrackerBarometerMock: any = new Promise((resolve, _) => {
            resolve({
              data: {
                low: "1.5",
                medium: "2.4",
                high: "3.7",
                next_base: "3.8",
              },
            });
          });

          mockedNetwork.mockReturnValueOnce(gastrackerBarometerMock);

          const gasOptions: GasOptions = await getGasOptions({
            currency: fakeCurrency as CryptoCurrency,
            options: {
              useEIP1559: false,
            },
          });

          Object.keys(gasOptions).forEach(key => {
            const strategy = key as Strategy;

            const feeData = gasOptions[strategy];

            const { gasPrice } = feeData;

            expect(gasPrice?.isInteger(), `${key}:gasPrice - got ${gasPrice}`).toBe(true);
          });
        });
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
    });
  });
});
