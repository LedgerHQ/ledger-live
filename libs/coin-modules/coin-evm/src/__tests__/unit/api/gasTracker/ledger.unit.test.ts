import { AssertionError } from "assert";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { getGasOptions } from "../../../../api/gasTracker/ledger";
import { LedgerGasTrackerUsedIncorrectly, NoGasTrackerFound } from "../../../../errors";
import { GasOptions } from "../../../../types";
import { getCoinConfig } from "../../../../config";

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

const fakeCurrency: Partial<CryptoCurrency> = {
  id: "ethereum",
  ethereumLikeInfo: {
    chainId: 1,
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};

const TEST_EIP1559_BASE_FEE_MULTIPLIER = 2;

jest.mock("../../../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

describe("EVM Family", () => {
  beforeEach(() => {
    mockGetConfig.mockImplementation((): any => {
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
    });
  });

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

          Object.entries(gasOptions).forEach(([key, value]) => {
            const { maxFeePerGas } = value;

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

          Object.entries(gasOptions).forEach(([key, value]) => {
            const { maxFeePerGas, maxPriorityFeePerGas, nextBaseFee } = value;

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

        it("should use overrideGasTracker", async () => {
          mockGetConfig.mockImplementationOnce((): any => {
            return {
              info: {
                gasTracker: {
                  type: "other",
                  explorerId: "anything",
                },
              },
            };
          });

          await getGasOptions({
            currency: fakeCurrency as CryptoCurrency,
            options: {
              useEIP1559: true,
              overrideGasTracker: { type: "ledger", explorerId: "eth_goerli" },
            },
          });

          expect(mockedNetwork).toHaveBeenCalledWith({
            method: "GET",
            url: "https://explorers.api.live.ledger.com/blockchain/v4/eth_goerli/gastracker/barometer?display=eip1559",
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
          mockGetConfig.mockImplementationOnce((): any => {
            return {
              info: {
                gasTracker: {
                  type: "ledger",
                  explorerId: "etc",
                },
              },
            };
          });

          const gasOptions: GasOptions = await getGasOptions({
            currency: {
              ethereumLikeInfo: {},
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

          Object.entries(gasOptions).forEach(([key, value]) => {
            const { gasPrice } = value;

            expect(gasPrice?.isInteger(), `${key}:gasPrice - got ${gasPrice}`).toBe(true);
          });
        });

        it("should use overrideGasTracker", async () => {
          mockGetConfig.mockImplementationOnce((): any => {
            return {
              info: {
                gasTracker: {
                  type: "other",
                  explorerId: "anything",
                },
              },
            };
          });

          await getGasOptions({
            currency: fakeCurrency as CryptoCurrency,
            options: {
              useEIP1559: false,
              overrideGasTracker: { type: "ledger", explorerId: "eth_goerli" },
            },
          });

          expect(mockedNetwork).toHaveBeenCalledWith({
            method: "GET",
            url: "https://explorers.api.live.ledger.com/blockchain/v4/eth_goerli/gastracker/barometer",
          });
        });
      });

      it("should throw if the gas tracker type isn't ledger", async () => {
        mockGetConfig.mockImplementationOnce((): any => {
          return {
            info: {
              gasTracker: {
                type: "wrong",
                explorerId: "anything",
              },
            },
          };
        });

        try {
          await getGasOptions({
            currency: { ethereumLikeInfo: {} },
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
        mockGetConfig.mockImplementationOnce((): any => {
          return {
            info: {
              gasTracker: {
                type: "ledger",
                explorerId: "anything",
              },
            },
          };
        });

        try {
          await getGasOptions({
            currency: {
              ethereumLikeInfo: {},
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
