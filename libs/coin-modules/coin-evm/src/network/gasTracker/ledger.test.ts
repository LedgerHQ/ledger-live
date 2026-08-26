import { AssertionError } from "assert";
import network from "@ledgerhq/live-network/network";
import BigNumber from "bignumber.js";
import { EvmConfigInfo } from "../../config";
import { LedgerGasTrackerUsedIncorrectly, NoGasTrackerFound } from "../../errors";
import { GasOptions } from "../../types";
import { getGasOptions } from "./ledger";

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

const TEST_EIP1559_BASE_FEE_MULTIPLIER = 2;

const ledgerGasTrackerConfig = {
  node: { type: "ledger", explorerId: "eth" },
  gasTracker: { type: "ledger", explorerId: "eth" },
  eip1559BaseFeeMultiplier: TEST_EIP1559_BASE_FEE_MULTIPLIER,
} as unknown as EvmConfigInfo;

describe("EVM Family", () => {
  describe("network/gasTracker/index.ts", () => {
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
            currencyId: "ethereum",
            config: ledgerGasTrackerConfig,
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

        it("should return integer values when eip1559BaseFeeMultiplier is a float", async () => {
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
            currencyId: "ethereum",
            config: { ...ledgerGasTrackerConfig, eip1559BaseFeeMultiplier: 1.5 },
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
            currencyId: "ethereum",
            config: ledgerGasTrackerConfig,
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
          await getGasOptions({
            currencyId: "ethereum",
            config: { gasTracker: { type: "other", explorerId: "anything" } } as any,
            options: {
              useEIP1559: true,
              overrideGasTracker: { type: "ledger", explorerId: "eth_sepolia" },
            },
          });

          expect(mockedNetwork).toHaveBeenCalledWith({
            method: "GET",
            url: "https://explorers.api.live.ledger.com/blockchain/v4/eth_sepolia/gastracker/barometer?display=eip1559",
          });
        });
      });

      describe("legacy gas options", () => {
        it("should return legacy gas options", async () => {
          const gasOptions: GasOptions = await getGasOptions({
            currencyId: "ethereum",
            config: ledgerGasTrackerConfig,
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

        it("should return legacy gas options when EIP-1559 not supported by gas tracker", async () => {
          const gasOptions: GasOptions = await getGasOptions({
            currencyId: "ethereum_classic",
            config: { gasTracker: { type: "ledger", explorerId: "etc" } } as any,
            options: { useEIP1559: true },
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
            currencyId: "ethereum",
            config: ledgerGasTrackerConfig,
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
          await getGasOptions({
            currencyId: "ethereum",
            config: { gasTracker: { type: "other", explorerId: "anything" } } as any,
            options: {
              useEIP1559: false,
              overrideGasTracker: { type: "ledger", explorerId: "eth_sepolia" },
            },
          });

          expect(mockedNetwork).toHaveBeenCalledWith({
            method: "GET",
            url: "https://explorers.api.live.ledger.com/blockchain/v4/eth_sepolia/gastracker/barometer",
          });
        });
      });

      it("should throw if the gas tracker type isn't ledger", async () => {
        try {
          await getGasOptions({
            currencyId: "ethereum",
            config: { gasTracker: { type: "wrong", explorerId: "anything" } } as any,
          });
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
            currencyId: "ethereum",
            config: { gasTracker: { type: "ledger", explorerId: "anything" } } as any,
          });
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
