import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { AssertionError, fail } from "assert";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { EvmTransactionLegacy, Transaction as EvmTransaction } from "../../../../types";
import { GasEstimationError, InsufficientFunds } from "../../../../errors";
import { makeAccount } from "../../../fixtures/common.fixtures";
import * as RPC_API from "../../../../api/node/rpc.common";

jest.useFakeTimers();

const fakeCurrency: Partial<CryptoCurrency> = {
  id: "my_new_chain" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
    node: {
      type: "external",
      uri: "my-rpc.com",
    },
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};
const fakeCurrencyWithoutRPC: Partial<CryptoCurrency> = {
  id: "my_new_chain" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};
const account = makeAccount(
  "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
  fakeCurrency as CryptoCurrency,
);

const mockedNetwork = {
  name: "mockedEthereum",
  chainId: 24,
};

jest.mock("@ledgerhq/live-promise");
(delay as jest.Mock).mockImplementation(
  () => new Promise(resolve => setTimeout(resolve, 1)), // mocking the delay supposed to happen after each try
);

describe("EVM Family", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(ethers.providers.StaticJsonRpcProvider.prototype, "_ready")
      .mockResolvedValue(mockedNetwork);
    jest
      .spyOn(ethers.providers.StaticJsonRpcProvider.prototype, "getNetwork")
      .mockResolvedValue(mockedNetwork);
    jest
      .spyOn(ethers.providers.StaticJsonRpcProvider.prototype, "detectNetwork")
      .mockResolvedValue(mockedNetwork);
    jest
      .spyOn(ethers.providers.StaticJsonRpcProvider.prototype, "getResolver")
      .mockResolvedValue(null);
    jest
      .spyOn(ethers.providers.StaticJsonRpcProvider.prototype, "resolveName")
      .mockImplementation(async address => address);
    jest
      .spyOn(ethers.providers.StaticJsonRpcProvider.prototype, "perform")
      .mockImplementation(async (method, params) => {
        switch (method) {
          case "getBalance":
            return ethers.BigNumber.from(420);
          case "getBlockNumber":
            return ethers.BigNumber.from(69);
          case "getTransaction":
            return {
              hash: "0x435b00d28a10febbcfefbdea080134d08ef843df122d5bc9174b09de7fce6a59",
              blockHash: "0x474dee0136108e9412e9d84197b468bb057a8dad0f2024fc55adebc4a28fa8c5",
              blockNumber: 69,
              confirmations: 100,
              from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
              nonce: 123,
              gasLimit: ethers.BigNumber.from(123),
              data: "0x",
              value: ethers.BigNumber.from(456),
              chainId: mockedNetwork.chainId,
            };
          case "call":
            return "0x00000000000000000000000000000000000000000000000000000000000001A4"; // 420 as uint256 hex
          case "getTransactionCount":
            return ethers.BigNumber.from(5);
          case "estimateGas":
            return ethers.BigNumber.from(5);
          case "getBlock":
            return {
              hash: "0x474dee0136108e9412e9d84197b468bb057a8dad0f2024fc55adebc4a28fa8c5",
              parentHash: "0xfc900c22725f9c0843c9cf7d2c47f4b61b246bd21e18e99f709aebaefc8aff14",
              number: 1,
              difficulty: null,
              gasLimit: ethers.BigNumber.from(1),
              gasUsed: ethers.BigNumber.from(2),
              extraData: "0x",
              baseFeePerGas: ethers.BigNumber.from(123),
              timestamp: Math.floor(Date.now() / 1000),
            };
          case "getGasPrice":
            return ethers.BigNumber.from(666);
          case "sendTransaction":
            if (
              params.signedTransaction ===
              "0x02f873012d85010c388d0085077715912682520894c2907efcce4011c491bbeda8a0fa63ba7aab596c87038d7ea4c6800080c001a0bbffe7ba303ab03f697d64672c4a288ae863df8a62ffc67ba72872ce8c227f6fa01261e7c9f06af13631f03fad9b88d3c48931d353b6b41b4072fddcca5ec41628"
            ) {
              const err = new Error();
              // @ts-expect-error adding code prop
              err.code = "INSUFFICIENT_FUNDS";

              throw err;
            } else if (
              params.signedTransaction ===
              "0x02f873012d85010c388d0085077715912682520894c2907efcce4011c491bbeda8a0fa63ba7aab596c87038d7ea4c6800080c001a0bbffe7ba303ab03f697d64672c4a288ae863df8a62ffc67ba72872ce8c227f6fa01261e7c9f06af13631f03fad9b88d3c48931d353b6b41b4072fddcca5ec41625"
            ) {
              throw new Error("any error");
            }
            return "0x435b00d28a10febbcfefbdea080134d08ef843df122d5bc9174b09de7fce6a59";
          default:
            throw Error(`Please mock this method: ${method}`);
        }
      });
  });

  describe("api/rpc/rpc.common.ts", () => {
    describe("withApi", () => {
      it("should throw if the currency doesn't have an RPC node", async () => {
        try {
          await RPC_API.withApi(
            fakeCurrencyWithoutRPC as CryptoCurrency,
            (() => Promise.resolve()) as any,
          );
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect((e as Error).message).toEqual("Currency doesn't have an RPC node provided");
        }
      });

      it("should retry on fail", async () => {
        let retries = 2;
        const spy = jest.fn(async () => {
          if (retries) {
            --retries;
            throw new Error();
          }
          return true;
        });
        const response = await RPC_API.withApi(fakeCurrency as CryptoCurrency, spy, retries);

        expect(response).toBe(true);
        // it should fail 2 times and succeed on the next try
        expect(spy).toBeCalledTimes(3);
      });

      it("should throw after too many retries", async () => {
        const SpyError = class SpyError extends Error {};

        let retries = RPC_API.DEFAULT_RETRIES_RPC_METHODS + 1;
        const spy = jest.fn(async () => {
          if (retries) {
            --retries;
            throw new SpyError();
          }
          return true;
        });

        try {
          await RPC_API.withApi(fakeCurrency as CryptoCurrency, spy);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(SpyError);
        }
      });
    });

    describe("getTransaction", () => {
      it("should return the expected payload", async () => {
        expect(
          await RPC_API.getTransaction(
            fakeCurrency as CryptoCurrency,
            "0x435b00d28a10febbcfefbdea080134d08ef843df122d5bc9174b09de7fce6a59",
          ),
        ).toEqual({
          blockHash: "0x474dee0136108e9412e9d84197b468bb057a8dad0f2024fc55adebc4a28fa8c5",
          blockHeight: 69,
          hash: "0x435b00d28a10febbcfefbdea080134d08ef843df122d5bc9174b09de7fce6a59",
          nonce: 123,
        });
      });
    });

    describe("getCoinBalance", () => {
      it("should return the expected payload", async () => {
        expect(
          await RPC_API.getCoinBalance(
            fakeCurrency as CryptoCurrency,
            "0x435b00d28a10febbcfefbdea080134d08ef843df122d5bc9174b09de7fce6a59",
          ),
        ).toEqual(new BigNumber(420));
      });
    });
  });

  describe("getTokenBalance", () => {
    it("should return the expected payload", async () => {
      expect(
        await RPC_API.getTokenBalance(
          fakeCurrency as CryptoCurrency,
          "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
          "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        ),
      ).toEqual(new BigNumber(420));
    });
  });

  describe("getTransactionCount", () => {
    it("should return the expected payload", async () => {
      expect(
        await RPC_API.getTransactionCount(
          fakeCurrency as CryptoCurrency,
          "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
        ),
      ).toEqual(5);
    });
  });

  describe("getGasEstimation", () => {
    it("should return the expected payload", async () => {
      expect(
        await RPC_API.getGasEstimation(account, {
          recipient: "0x0000000000000000000000000000000000000000",
          amount: new BigNumber(2),
          gasLimit: new BigNumber(0),
          gasPrice: new BigNumber(0),
          data: Buffer.from(""),
          type: 0,
        } as EvmTransactionLegacy),
      ).toEqual(new BigNumber(5));
    });

    it("should throw a GasEstimationError in case of error", async () => {
      try {
        await RPC_API.getGasEstimation(account, {
          recipient: "wrongAddress",
          amount: new BigNumber(2),
          gasLimit: new BigNumber(0),
          gasPrice: new BigNumber(0),
          data: Buffer.from(""),
          type: 0,
        } as EvmTransactionLegacy);
        fail("Promise should have been rejected");
      } catch (e) {
        if (e instanceof AssertionError) {
          throw e;
        }
        expect(e).toBeInstanceOf(GasEstimationError);
      }
    });
  });

  describe("getFeeData", () => {
    it("should return the expected payload for an EIP1559 tx", async () => {
      jest
        .spyOn(ethers.providers.StaticJsonRpcProvider.prototype, "send")
        .mockImplementationOnce(async method => {
          if (method === "eth_feeHistory") {
            return {
              reward: [
                ["0x4a817c7ee", "0x4a817c7ee"],
                ["0x773593f0", "0x773593f5"],
                ["0x0", "0x0"],
                ["0x773593f5", "0x773bae75"],
              ],
              baseFeePerGas: ["0x12", "0x10", "0x10", "0xe", "0xd"],
              gasUsedRatio: [0.026089875, 0.406803, 0, 0.0866665],
            };
          }
        });

      expect(await RPC_API.getFeeData(fakeCurrency as CryptoCurrency, {} as any)).toEqual({
        maxFeePerGas: new BigNumber("6000000014"),
        maxPriorityFeePerGas: new BigNumber("5999999988"),
        gasPrice: null,
        nextBaseFee: new BigNumber("13"),
      });
    });

    it("should return the expected payload for an EIP1559 tx when network returns 0 priority fee", async () => {
      jest
        .spyOn(ethers.providers.StaticJsonRpcProvider.prototype, "send")
        .mockImplementationOnce(async method => {
          if (method === "eth_feeHistory") {
            return {
              reward: [
                ["0x0", "0x0"],
                ["0x0", "0x0"],
                ["0x0", "0x0"],
                ["0x0", "0x0"],
              ],
              baseFeePerGas: ["0x12", "0x10", "0x10", "0xe", "0xd"],
              gasUsedRatio: [0.026089875, 0.406803, 0, 0.0866665],
            };
          }
        });

      expect(await RPC_API.getFeeData(fakeCurrency as CryptoCurrency, {} as any)).toEqual({
        maxFeePerGas: new BigNumber("1000000026"),
        maxPriorityFeePerGas: new BigNumber(1e9),
        gasPrice: null,
        nextBaseFee: new BigNumber("13"),
      });
    });

    it("should return the expected payload for a legacy tx", async () => {
      jest
        .spyOn(ethers.providers.StaticJsonRpcProvider.prototype, "perform")
        .mockImplementationOnce(async method => {
          switch (method) {
            case "getBlock":
              return {
                parentHash: "0x474dee0136108e9412e9d84197b468bb057a8dad0f2024fc55adebc4a28fa8c5",
                number: 1,
                timestamp: 123,
                difficulty: null,
                gasLimit: ethers.BigNumber.from(1),
                gasUsed: ethers.BigNumber.from(2),
                extraData: "0x",
              };
            default:
              throw new Error(`Method not mocked: ${method}`);
          }
        });

      expect(
        await RPC_API.getFeeData(
          {
            ...fakeCurrency,
            id: "optimism",
          } as CryptoCurrency,
          {} as any,
        ),
      ).toEqual({
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gasPrice: new BigNumber("666"),
        nextBaseFee: null,
      });
    });
  });

  describe("broadcastTransaction", () => {
    it("should return the expected payload", async () => {
      const serializedTransaction =
        "0x02f873012d85010c388d0085077715912682520894c2907efcce4011c491bbeda8a0fa63ba7aab596c87038d7ea4c6800080c001a0bbffe7ba303ab03f697d64672c4a288ae863df8a62ffc67ba72872ce8c227f6fa01261e7c9f06af13631f03fad9b88d3c48931d353b6b41b4072fddcca5ec41629";
      expect(
        await RPC_API.broadcastTransaction(fakeCurrency as CryptoCurrency, serializedTransaction),
      ).toEqual("0x435b00d28a10febbcfefbdea080134d08ef843df122d5bc9174b09de7fce6a59");
    });

    it("should throw an insufficient funds errors", async () => {
      const serializedTransaction =
        "0x02f873012d85010c388d0085077715912682520894c2907efcce4011c491bbeda8a0fa63ba7aab596c87038d7ea4c6800080c001a0bbffe7ba303ab03f697d64672c4a288ae863df8a62ffc67ba72872ce8c227f6fa01261e7c9f06af13631f03fad9b88d3c48931d353b6b41b4072fddcca5ec41628";

      try {
        await RPC_API.broadcastTransaction(fakeCurrency as CryptoCurrency, serializedTransaction);
        fail("Promise should have been rejected");
      } catch (e) {
        if (e instanceof AssertionError) {
          throw e;
        }
        expect(e).toBeInstanceOf(InsufficientFunds);
      }
    });

    it("should throw any other error", async () => {
      const serializedTransaction =
        "0x02f873012d85010c388d0085077715912682520894c2907efcce4011c491bbeda8a0fa63ba7aab596c87038d7ea4c6800080c001a0bbffe7ba303ab03f697d64672c4a288ae863df8a62ffc67ba72872ce8c227f6fa01261e7c9f06af13631f03fad9b88d3c48931d353b6b41b4072fddcca5ec41625";

      try {
        await RPC_API.broadcastTransaction(fakeCurrency as CryptoCurrency, serializedTransaction);
        fail("Promise should have been rejected");
      } catch (e) {
        if (e instanceof AssertionError) {
          throw e;
        }
        expect((e as Error).message).toEqual("any error");
      }
    });
  });

  describe("getBlock", () => {
    it("should return the expected payload", async () => {
      expect(await RPC_API.getBlockByHeight(fakeCurrency as CryptoCurrency, 0)).toEqual({
        hash: "0x474dee0136108e9412e9d84197b468bb057a8dad0f2024fc55adebc4a28fa8c5",
        timestamp: Math.floor(Date.now() / 1000),
        height: 1,
      });
    });
  });

  describe("getOptimismAdditionalFees", () => {
    it("should return the expected payload", async () => {
      // @ts-expect-error LRUCache
      RPC_API.getOptimismAdditionalFees.reset();
      expect(
        await RPC_API.getOptimismAdditionalFees(
          { ...fakeCurrency, id: "optimism" } as CryptoCurrency,
          {
            mode: "send",
            family: "evm",
            recipient: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            maxFeePerGas: new BigNumber("0x777159126"),
            maxPriorityFeePerGas: new BigNumber("0x10c388d00"),
            amount: new BigNumber("0x38d7ea4c68000"),
            gasLimit: new BigNumber(0),
            data: Buffer.from(""),
            type: 2,
            chainId: 1,
            nonce: 52,
          } as EvmTransaction,
        ),
      ).toEqual(new BigNumber(420));
    });

    it("should return 0 if the currency isn't optimism", async () => {
      expect(
        await RPC_API.getOptimismAdditionalFees(
          fakeCurrency as CryptoCurrency,
          {
            mode: "send",
            family: "evm",
            recipient: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            maxFeePerGas: new BigNumber("0x777159126"),
            maxPriorityFeePerGas: new BigNumber("0x10c388d00"),
            amount: new BigNumber("0x38d7ea4c68000"),
            gasLimit: new BigNumber(0),
            data: Buffer.from(""),
            type: 2,
            chainId: 1,
            nonce: 52,
          } as EvmTransaction,
        ),
      ).toEqual(new BigNumber(0));
    });

    it("should return 0 if the transaction is invalid", async () => {
      expect(
        await RPC_API.getOptimismAdditionalFees(
          fakeCurrency as CryptoCurrency,
          {
            mode: "send",
            family: "evm",
            recipient: "", // no recipient for example
            maxFeePerGas: new BigNumber("0x777159126"),
            maxPriorityFeePerGas: new BigNumber("0x10c388d00"),
            amount: new BigNumber("0x38d7ea4c68000"),
            gasLimit: new BigNumber(0),
            data: Buffer.from(""),
            type: 2,
            chainId: 1,
            nonce: 52,
          } as EvmTransaction,
        ),
      ).toEqual(new BigNumber(0));
    });
  });
});
