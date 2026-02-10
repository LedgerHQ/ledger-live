import { AssertionError, fail } from "assert";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency, CryptoCurrencyId, EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { JsonRpcProvider, TransactionReceipt, TransactionResponse, ethers } from "ethers";
import { getCoinConfig } from "../../config";
import { GasEstimationError, InsufficientFunds } from "../../errors";
import { makeAccount } from "../../fixtures/common.fixtures";
import {
  EvmTransactionLegacy,
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
} from "../../types";
import * as RPC_API from "./rpc.common";

jest.useFakeTimers();

jest.mock("../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

const fakeCurrency: Partial<CryptoCurrency> = {
  id: "my_new_chain" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
  },
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};

const fakeCurrencyWithoutRPC: Partial<CryptoCurrency> = {
  id: "my_new_chain" as CryptoCurrencyId,
  ethereumLikeInfo: {
    chainId: 1,
  } as EthereumLikeInfo,
  units: [{ code: "ETH", name: "ETH", magnitude: 18 }],
};
const account = makeAccount(
  "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
  fakeCurrency as CryptoCurrency,
);

jest.mock("@ledgerhq/live-promise");
(delay as jest.Mock).mockImplementation(
  () => new Promise(resolve => setTimeout(resolve, 1)), // mocking the delay supposed to happen after each try
);

describe("EVM Family", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockGetConfig.mockImplementation((): any => {
      return {
        info: {
          node: {
            type: "external",
            uri: "my-rpc.com",
          },
        },
      };
    });

    jest.spyOn(JsonRpcProvider.prototype, "getFeeData").mockResolvedValue({
      gasPrice: BigInt(666),
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
    } as ethers.FeeData);

    jest.spyOn(JsonRpcProvider.prototype, "getBalance").mockResolvedValue(BigInt(420));
    jest
      .spyOn(JsonRpcProvider.prototype, "call")
      .mockResolvedValue("0x000000000000000000000000000000000000000000000000000000000000A455");
    jest.spyOn(JsonRpcProvider.prototype, "getBlock").mockResolvedValue({
      hash: "0x474dee0136108e9412e9d84197b468bb057a8dad0f2024fc55adebc4a28fa8c5",
      parentHash: "0xfc900c22725f9c0843c9cf7d2c47f4b61b246bd21e18e99f709aebaefc8aff14",
      number: 1,
      difficulty: 0n,
      gasLimit: BigInt(1),
      gasUsed: BigInt(2),
      extraData: "0x",
      baseFeePerGas: BigInt(123),
      timestamp: Math.floor(Date.now() / 1000),
    } as Partial<ethers.Block> as ethers.Block);

    jest.spyOn(JsonRpcProvider.prototype, "getTransactionCount").mockResolvedValue(5);

    jest.spyOn(JsonRpcProvider.prototype, "getTransaction").mockResolvedValue({
      hash: "0x435b00d28a10febbcfefbdea080134d08ef843df122d5bc9174b09de7fce6a59",
      blockNumber: 69,
      blockHash: "0x474dee0136108e9412e9d84197b468bb057a8dad0f2024fc55adebc4a28fa8c5",
      nonce: 123,
      value: BigInt(456),
      gasLimit: BigInt(123),
      gasPrice: BigInt(789),
      data: "0x",
      to: "0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C",
      from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
      type: 0,
      confirmations: jest.fn().mockResolvedValue(1),
      provider: {} as any,
    } as Partial<TransactionResponse> as TransactionResponse);

    jest.spyOn(JsonRpcProvider.prototype, "getTransactionReceipt").mockResolvedValue({
      blockHash: "0x8a179bc6cb299f936c4fd614995e62d597ec6108b579c23034fb220967ceaa94",
      blockNumber: 69,
      byzantium: true,
      confirmations: jest.fn().mockResolvedValue(100),
      contractAddress: null,
      cumulativeGasUsed: BigInt(121),
      effectiveGasPrice: BigInt(789),
      from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
      gasUsed: BigInt(122),
      gasLimit: BigInt(21000),
      gasPrice: BigInt(789),
      logs: [],
      logsBloom: "0x",
      status: 1,
      to: "0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C",
      transactionHash: "0x435b00d28a10febbcfefbdea080134d08ef843df122d5bc9174b09de7fce6a59",
      transactionIndex: 123,
      type: 0,
    } as Partial<TransactionReceipt> as TransactionReceipt);

    jest
      .spyOn(JsonRpcProvider.prototype, "broadcastTransaction")
      .mockImplementation(async (signedTx: string): Promise<any> => {
        if (
          signedTx ===
          "0x02f873012d85010c388d0085077715912682520894c2907efcce4011c491bbeda8a0fa63ba7aab596c87038d7ea4c6800080c001a0bbffe7ba303ab03f697d64672c4a288ae863df8a62ffc67ba72872ce8c227f6fa01261e7c9f06af13631f03fad9b88d3c48931d353b6b41b4072fddcca5ec41628"
        ) {
          const err = new Error("Insufficient funds");
          // @ts-expect-error for test mocking
          err.code = "INSUFFICIENT_FUNDS";
          throw err;
        } else if (
          signedTx ===
          "0x02f873012d85010c388d0085077715912682520894c2907efcce4011c491bbeda8a0fa63ba7aab596c87038d7ea4c6800080c001a0bbffe7ba303ab03f697d64672c4a288ae863df8a62ffc67ba72872ce8c227f6fa01261e7c9f06af13631f03fad9b88d3c48931d353b6b41b4072fddcca5ec41625"
        ) {
          throw new Error("any error");
        }

        return {
          hash: "0x435b00d28a10febbcfefbdea080134d08ef843df122d5bc9174b09de7fce6a59",
        };
      });
  });

  describe("network/rpc/rpc.common.ts", () => {
    describe("withApi", () => {
      it("should throw if the currency doesn't have an RPC node", async () => {
        mockGetConfig.mockImplementationOnce((): any => {
          return { info: {} };
        });

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
        expect(spy).toHaveBeenCalledTimes(3);
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
          gasPrice: "789",
          gasUsed: "122",
          value: "456",
          status: 1,
          from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          to: "0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C",
          erc20Transfers: [],
        });
      });
    });

    describe("parseERC20TransfersFromLogs", () => {
      const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
      const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

      it("should parse single ERC20 Transfer (Velas EVM)", () => {
        // Real data from Velas EVM tx 0x23f9232e929f9a13f4f2d6d4e9bf27d717a2b1250d207c030fc66565c4e205e1
        const logs = [
          {
            address: "0xabf26902fd7b624e0db40d31171ea9dddf078351",
            topics: [
              TRANSFER_TOPIC,
              "0x000000000000000000000000534eef6db44fbeb71047ee3eb4cb16e572862af6",
              "0x000000000000000000000000970402b253733a1f6f4f3cd1d07420006be2882d",
            ],
            data: "0x000000000000000000000000000000000000000000009d4d055051b140e00000",
          },
        ];

        const result = RPC_API.parseERC20TransfersFromLogs(logs);

        expect(result).toEqual([
          {
            asset: {
              type: "erc20",
              assetReference: "0xaBf26902Fd7B624e0db40D31171eA9ddDf078351",
            },
            from: "0x534eeF6Db44FBeB71047EE3eb4CB16E572862aF6",
            to: "0x970402B253733A1f6F4f3cd1d07420006be2882D",
            value: "742832320000000000000000",
          },
        ]);
      });

      it("should parse multiple ERC20 Transfers (Syscoin)", () => {
        // Real data from Syscoin tx 0x174e87764e5de5c1ba93410233a3c5bfa0d15d1e5ee948832a05a4dccec501a1
        const logs = [
          {
            address: "0xd3e822f3ef011ca5f17d82c956d952d8d7c3a1bb",
            topics: [
              TRANSFER_TOPIC,
              "0x000000000000000000000000017dad2578372caee5c6cddfe35eedb3728544c4",
              "0x0000000000000000000000001a7400f4dfe299dbac8034bd2bb0b3b17fca9342",
            ],
            data: "0x0000000000000000000000000000000000000000000001292003dcc05fb78898",
          },
          {
            address: "0xe18c200a70908c89ffa18c628fe1b83ac0065ea4",
            topics: [
              TRANSFER_TOPIC,
              "0x0000000000000000000000001a7400f4dfe299dbac8034bd2bb0b3b17fca9342",
              "0x0000000000000000000000004aa7d1957e5ff87eab80ac78da4925530f5351cf",
            ],
            data: "0x000000000000000000000000000000000000000000001135ecd1687a13c7e557",
          },
        ];

        const result = RPC_API.parseERC20TransfersFromLogs(logs);
        expect(result.map(r => r.value)).toEqual([
          "5480989920044678351000",
          "81274972180027185554775",
        ]);
      });

      it("should filter out non-Transfer events (Approval)", () => {
        const logs = [
          {
            address: "0x1111111111111111111111111111111111111111",
            topics: [
              TRANSFER_TOPIC,
              "0x000000000000000000000000534eef6db44fbeb71047ee3eb4cb16e572862af6",
              "0x000000000000000000000000970402b253733a1f6f4f3cd1d07420006be2882d",
            ],
            data: "0x0000000000000000000000000000000000000000000000000000000000000001",
          },
          {
            address: "0x1111111111111111111111111111111111111111",
            topics: [
              APPROVAL_TOPIC, // Approval event
              "0x000000000000000000000000534eef6db44fbeb71047ee3eb4cb16e572862af6",
              "0x000000000000000000000000970402b253733a1f6f4f3cd1d07420006be2882d",
            ],
            data: "0x0000000000000000000000000000000000000000000000000000000000000002",
          },
        ];

        const result = RPC_API.parseERC20TransfersFromLogs(logs);
        // Only the Transfer, not the Approval
        expect(result.map(r => r.value)).toEqual(["1"]);
      });

      it("should return empty array for logs with no Transfer events", () => {
        const logs = [
          {
            address: "0x2222222222222222222222222222222222222222",
            topics: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            data: "0x",
          },
        ];

        const result = RPC_API.parseERC20TransfersFromLogs(logs);

        expect(result).toHaveLength(0);
      });

      it("should handle empty logs array", () => {
        expect(RPC_API.parseERC20TransfersFromLogs([])).toEqual([]);
      });

      it("should filter out logs with wrong number of topics", () => {
        const logs = [
          {
            // Valid ERC-20 Transfer: 3 topics (signature, from, to) + value in data
            address: "0x3333333333333333333333333333333333333333",
            topics: [
              TRANSFER_TOPIC,
              "0x000000000000000000000000534eef6db44fbeb71047ee3eb4cb16e572862af6",
              "0x000000000000000000000000970402b253733a1f6f4f3cd1d07420006be2882d",
            ],
            data: "0x0000000000000000000000000000000000000000000000000000000000000001",
          },
          {
            // Invalid: only 2 topics (missing 'to')
            address: "0x3333333333333333333333333333333333333333",
            topics: [
              TRANSFER_TOPIC,
              "0x000000000000000000000000534eef6db44fbeb71047ee3eb4cb16e572862af6",
            ],
            data: "0x0000000000000000000000000000000000000000000000000000000000000002",
          },
          {
            // ERC-721 Transfer: 4 topics (signature, from, to, tokenId) - should be filtered out
            // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
            address: "0x4444444444444444444444444444444444444444",
            topics: [
              TRANSFER_TOPIC, // Same signature hash as ERC-20
              "0x000000000000000000000000534eef6db44fbeb71047ee3eb4cb16e572862af6", // from
              "0x000000000000000000000000970402b253733a1f6f4f3cd1d07420006be2882d", // to
              "0x0000000000000000000000000000000000000000000000000000000000000042", // tokenId (indexed)
            ],
            data: "0x", // No data for ERC-721 Transfer
          },
        ];

        // Note: ERC-1155 uses different event signatures (TransferSingle/TransferBatch)
        // so it's already filtered out by the topic[0] check, not by topics.length

        const result = RPC_API.parseERC20TransfersFromLogs(logs);

        expect(result.map(r => r.value)).toEqual(["1"]);
      });

      it("should filter out Transfer with 3 topics but empty data", () => {
        const logs = [
          {
            // Transfer with 3 topics but no data - cannot determine value
            address: "0x3333333333333333333333333333333333333333",
            topics: [
              TRANSFER_TOPIC,
              "0x000000000000000000000000534eef6db44fbeb71047ee3eb4cb16e572862af6",
              "0x000000000000000000000000970402b253733a1f6f4f3cd1d07420006be2882d",
            ],
            data: "0x",
          },
        ];

        const result = RPC_API.parseERC20TransfersFromLogs(logs);

        expect(result).toEqual([]);
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
      ).toEqual(new BigNumber(42069));
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
      jest
        .spyOn(JsonRpcProvider.prototype as any, "_perform")
        .mockImplementation(async (req: any) => {
          if (req.method === "estimateGas") {
            return 5n;
          }
          return null;
        });
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
      jest
        .spyOn(JsonRpcProvider.prototype as any, "_perform")
        .mockImplementation(async (req: any) => {
          if (req.method === "estimateGas") {
            throw new Error("fail");
          }
          return null;
        });

      await expect(
        RPC_API.getGasEstimation(account, {
          recipient: "wrongAddress",
          amount: new BigNumber(1),
          data: Buffer.from(""),
        }),
      ).rejects.toThrow(GasEstimationError);
    });
  });

  describe("getFeeData", () => {
    const eip1559Tx: EvmTransactionEIP1559 = {
      amount: new BigNumber(100),
      useAllAmount: false,
      recipient: "0xlmb",
      family: "evm",
      mode: "send",
      nonce: 0,
      gasLimit: new BigNumber(0),
      chainId: 1,
      maxFeePerGas: new BigNumber(0),
      maxPriorityFeePerGas: new BigNumber(0),
      type: 2,
    };

    it("should return the expected payload for an EIP1559 tx", async () => {
      jest.spyOn(JsonRpcProvider.prototype, "send").mockImplementationOnce(async method => {
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

      expect(await RPC_API.getFeeData(fakeCurrency as CryptoCurrency, eip1559Tx)).toEqual({
        maxFeePerGas: new BigNumber("6000000014"),
        maxPriorityFeePerGas: new BigNumber("5999999988"),
        gasPrice: null,
        nextBaseFee: new BigNumber("13"),
      });
    });

    it("should return the expected payload for an EIP1559 tx when network returns 0 priority fee", async () => {
      jest.spyOn(JsonRpcProvider.prototype, "send").mockImplementationOnce(async method => {
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

      expect(await RPC_API.getFeeData(fakeCurrency as CryptoCurrency, eip1559Tx)).toEqual({
        maxFeePerGas: new BigNumber("1000000026"),
        maxPriorityFeePerGas: new BigNumber(1e9),
        gasPrice: null,
        nextBaseFee: new BigNumber("13"),
      });
    });

    it("should return the expected payload for an EIP1559 tx when network returns 0 priority fee for 0G", async () => {
      jest.spyOn(JsonRpcProvider.prototype, "send").mockImplementationOnce(async method => {
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

      expect(
        await RPC_API.getFeeData(
          { ...fakeCurrency, id: "zero_gravity" } as CryptoCurrency,
          eip1559Tx,
        ),
      ).toEqual({
        maxFeePerGas: new BigNumber("2000000026"),
        maxPriorityFeePerGas: new BigNumber(2e9),
        gasPrice: null,
        nextBaseFee: new BigNumber("13"),
      });
    });

    const legacyTx: EvmTransactionLegacy = {
      amount: new BigNumber(100),
      useAllAmount: false,
      recipient: "0xlmb",
      family: "evm",
      mode: "send",
      nonce: 0,
      gasLimit: new BigNumber(0),
      chainId: 1,
      gasPrice: new BigNumber(0),
      type: 0,
    };

    it("should return the expected payload for a legacy tx", async () => {
      jest.spyOn(JsonRpcProvider.prototype as any, "send").mockImplementationOnce(async method => {
        switch (method) {
          case "eth_getBlockByNumber":
            return {
              parentHash: "0x474dee0136108e9412e9d84197b468bb057a8dad0f2024fc55adebc4a28fa8c5",
              number: 1,
              timestamp: 123,
              difficulty: 0n,
              gasLimit: 1n,
              gasUsed: 2n,
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
          legacyTx,
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
        // for this specific assertion we can't use Date.now() directly because
        // the timestamp returned by ethers (and mocked at the beginning of
        // thetestsuite) is rounded to the second
        timestamp: Math.floor(Date.now() / 1000) * 1000,
        height: 1,
        parentHash: "0xfc900c22725f9c0843c9cf7d2c47f4b61b246bd21e18e99f709aebaefc8aff14",
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
      ).toEqual(new BigNumber(42069));
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

  describe("getScrollAdditionalFees", () => {
    it("should return the expected payload", async () => {
      expect(
        await RPC_API.getScrollAdditionalFees(
          { ...fakeCurrency, id: "scroll" } as CryptoCurrency,
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
      ).toEqual(new BigNumber(42069));
    });

    it("should return 0 if the currency isn't optimism", async () => {
      expect(
        await RPC_API.getScrollAdditionalFees(
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
        await RPC_API.getScrollAdditionalFees(
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

  /**
   * Tests to ensure addresses are normalized (lowercased) before being passed to ethers APIs.
   *
   * Background: Some EVM chains (like RSK) use EIP-1191 checksums that differ from EIP-55.
   * ethers.js validates checksums strictly and throws "bad address checksum" errors for
   * addresses with non-EIP-55 checksums. By normalizing to lowercase, we bypass checksum
   * validation since lowercase addresses are treated as not checksummed.
   *
   * @see https://github.com/rsksmart/RSKIPs/blob/master/IPs/RSKIP60.md
   */
  describe("Address normalization", () => {
    // This address has a valid EIP-1191 checksum (for RSK chainId 30) but not a valid EIP-55 checksum.
    // Without proper address normalization, ethers.js will throw "bad address checksum" error.
    const EIP1191_CHECKSUMMED_ADDRESS = "0xeF7778f630098Df7aD87cFEd8F4476e4c03eE329";
    const NORMALIZED_ADDRESS = "0xef7778f630098df7ad87cfed8f4476e4c03ee329";

    describe("getCoinBalance", () => {
      it("should call getBalance with normalized (lowercase) address", async () => {
        const getBalanceSpy = jest
          .spyOn(JsonRpcProvider.prototype, "getBalance")
          .mockResolvedValue(BigInt(100));

        await RPC_API.getCoinBalance(fakeCurrency as CryptoCurrency, EIP1191_CHECKSUMMED_ADDRESS);

        expect(getBalanceSpy).toHaveBeenCalledWith(NORMALIZED_ADDRESS);
      });
    });

    describe("getTokenBalance", () => {
      it("should call contract with normalized addresses for both account and token", async () => {
        const EIP1191_TOKEN_ADDRESS = "0xaBf26902Fd7B624e0db40D31171eA9ddDf078351";
        const NORMALIZED_TOKEN_ADDRESS = "0xabf26902fd7b624e0db40d31171ea9dddf078351";

        // The balanceOf call is made via Contract.call which internally uses _perform
        // We need to check that the Contract is constructed with the normalized address
        const callSpy = jest
          .spyOn(JsonRpcProvider.prototype, "call")
          .mockResolvedValue("0x0000000000000000000000000000000000000000000000000000000000000064");

        await RPC_API.getTokenBalance(
          fakeCurrency as CryptoCurrency,
          EIP1191_CHECKSUMMED_ADDRESS,
          EIP1191_TOKEN_ADDRESS,
        );

        // The call should be made to the normalized contract address
        // and the data should contain the normalized account address
        expect(callSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            to: NORMALIZED_TOKEN_ADDRESS,
            // The data contains the function selector (0x70a08231) + padded address
            data: expect.stringContaining(NORMALIZED_ADDRESS.slice(2)),
          }),
        );
      });
    });

    describe("getTransactionCount", () => {
      it("should call getTransactionCount with normalized (lowercase) address", async () => {
        const getTransactionCountSpy = jest
          .spyOn(JsonRpcProvider.prototype, "getTransactionCount")
          .mockResolvedValue(10);

        await RPC_API.getTransactionCount(
          fakeCurrency as CryptoCurrency,
          EIP1191_CHECKSUMMED_ADDRESS,
        );

        expect(getTransactionCountSpy).toHaveBeenCalledWith(NORMALIZED_ADDRESS, "pending");
      });
    });

    describe("getGasEstimation", () => {
      it("should call estimateGas with normalized recipient address", async () => {
        const EIP1191_RECIPIENT = "0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C";
        const NORMALIZED_RECIPIENT = "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c";

        let capturedTransaction: { from?: string; to?: string } | undefined;
        jest
          .spyOn(JsonRpcProvider.prototype as any, "_perform")
          .mockImplementation(
            async (req: { method: string; transaction?: typeof capturedTransaction }) => {
              if (req.method === "estimateGas") {
                capturedTransaction = req.transaction;
                return 21000n;
              }
              return null;
            },
          );

        await RPC_API.getGasEstimation(account, {
          recipient: EIP1191_RECIPIENT,
          amount: new BigNumber(1000),
          gasLimit: new BigNumber(0),
          gasPrice: new BigNumber(0),
          data: Buffer.from(""),
          type: 0,
        } as EvmTransactionLegacy);

        // Verify the 'to' address was normalized (recipient)
        // Note: ethers internally re-checksums addresses in the transaction object,
        // but we verify the 'to' field is lowercase before ethers processes it
        expect(capturedTransaction?.to?.toLowerCase()).toBe(NORMALIZED_RECIPIENT);
        // The 'from' address should also be lowercase
        expect(capturedTransaction?.from?.toLowerCase()).toBe(account.freshAddress.toLowerCase());
      });
    });
  });
});
