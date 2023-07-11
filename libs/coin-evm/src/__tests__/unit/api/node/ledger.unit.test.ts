import axios from "axios";
import BigNumber from "bignumber.js";
import { AssertionError, fail } from "assert";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { GasEstimationError, LedgerNodeUsedIncorrectly } from "../../../../errors";
import * as LEDGER_GAS_TRACKER from "../../../../api/gasTracker/ledger";
import { Transaction as EvmTransaction } from "../../../../types";
import { makeAccount } from "../../../fixtures/common.fixtures";
import * as LEDGER_API from "../../../../api/node/ledger";

jest.useFakeTimers({ doNotFake: ["setTimeout"] });

jest.mock("axios");
jest.mock("@ledgerhq/live-promise");
(delay as jest.Mock).mockImplementation(
  () => new Promise(resolve => setTimeout(resolve, 1)), // mocking the delay supposed to happen after each try
);

const currency = {
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    node: {
      type: "ledger",
      explorerId: "eth",
    },
  },
} as CryptoCurrency;

const wrongCurrency = {
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    node: {
      type: "wrongtype",
      uri: "eth",
    },
  },
} as any;

const account = makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", currency);

describe("EVM Family", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("api/node/index.ts", () => {
    describe("fetchWithRetries", () => {
      it("should retry on fail", async () => {
        let retries = 2;
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => {
          if (retries) {
            --retries;
            throw new Error();
          }
          return { data: true };
        });
        const response = await LEDGER_API.fetchWithRetries({} as any, retries);

        expect(response).toEqual(true);
        // it should fail 2 times and succeed on the next try
        expect(spy).toBeCalledTimes(3);
      });

      it("should throw after too many retries", async () => {
        const SpyError = class SpyError extends Error {};

        let retries = LEDGER_API.DEFAULT_RETRIES_API + 1;
        jest.spyOn(axios, "request").mockImplementation(async () => {
          if (retries) {
            --retries;
            throw new SpyError();
          }
          return { data: true };
        });
        try {
          await LEDGER_API.fetchWithRetries({} as any);
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
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.getTransaction(wrongCurrency, "0xHash");
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should return the expected payload", async () => {
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: {
            hash: "0x8d5ef4d7673fbfa6a4755cdfdb913742c47c7fdac2d214046387bbcbf10957c9",
            transaction_type: 2,
            nonce: "0x42420",
            nonce_value: 271392,
            value: "70494048649554430",
            gas: "32000",
            gas_price: "83953611012",
            max_fee_per_gas: "83953611012",
            max_priority_fee_per_gas: "0",
            from: "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
            to: "0x6d2e03b7effeae98bd302a9f836d0d6ab0002766",
            transfer_events: [],
            erc721_transfer_events: [],
            erc1155_transfer_events: [],
            approval_events: [],
            actions: [],
            confirmations: 1,
            input: null,
            gas_used: "21000",
            cumulative_gas_used: "20580589",
            status: 1,
            received_at: "2023-06-29T19:03:35Z",
            block: {
              hash: "0x6db17db08345729953a1408a56dcc588aa3d23e8cc917f2624b8bf047148cce2",
              height: 17586913,
              time: "2023-06-29T19:03:35Z",
            },
          },
        }));

        const response = await LEDGER_API.getTransaction(currency, "0xHash");
        expect(response).toEqual({
          hash: "0x8d5ef4d7673fbfa6a4755cdfdb913742c47c7fdac2d214046387bbcbf10957c9",
          blockHeight: 17586913,
          blockHash: "0x6db17db08345729953a1408a56dcc588aa3d23e8cc917f2624b8bf047148cce2",
          nonce: 271392,
        });
      });
    });

    describe("getCoinBalance", () => {
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.getCoinBalance(wrongCurrency, "0xAddress");
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should return the expected payload", async () => {
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: { balance: "6969" },
        }));

        expect(await LEDGER_API.getCoinBalance(currency, "0xkvn")).toEqual(new BigNumber("6969"));
      });
    });

    describe("getBatchTokenBalances", () => {
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.getBatchTokenBalances([], { currency: wrongCurrency });
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should return the expected payload", async () => {
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: [
            { address: "0xkvn", contract: "0xusdc", balance: "6969" },
            { address: "0xkvn", contract: "0xsquid", balance: "420" },
          ],
        }));

        expect(
          await LEDGER_API.getBatchTokenBalances(
            [
              { address: "0xkvn", contract: "0xusdc" },
              { address: "0xkvn", contract: "0xsquid" },
            ],
            { currency },
          ),
        ).toEqual([new BigNumber("6969"), new BigNumber("420")]);
      });
    });

    describe("getTokenBalance", () => {
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.getTokenBalance(wrongCurrency, "0xAddress", "0xContract");
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should return the expected payload", async () => {
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: [
            { address: "0xkvn", contract: "0xusdc", balance: "6969" },
            { address: "0xkvn", contract: "0xsquid", balance: "420" },
          ],
        }));

        expect(await LEDGER_API.getTokenBalance(currency, "0xusdc", "0xkvn")).toEqual(
          new BigNumber("6969"),
        );
      });
    });

    describe("getTransactionCount", () => {
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.getTransactionCount(wrongCurrency, "0xAddress");
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should return the expected payload", async () => {
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: { address: "0xkvn", nonce: 123 },
        }));

        expect(await LEDGER_API.getTransactionCount(currency, "0xkvn")).toEqual(123);
      });
    });

    describe("getGasEstimation", () => {
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.getGasEstimation({ ...account, currency: wrongCurrency }, {} as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should throw GasEstimationError on failure", async () => {
        jest.spyOn(axios, "request").mockImplementation(async () => {
          throw new Error();
        });

        try {
          await LEDGER_API.getGasEstimation(account, {} as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(GasEstimationError);
        }
      });

      it("should return the expected payload", async () => {
        jest.spyOn(axios, "request").mockImplementation(async ({ data: transaction }) => {
          return (transaction as any)?.data?.length > 2
            ? {
                data: {
                  to: "0xBob",
                  estimated_gas_limit: "1000000",
                },
              }
            : {
                data: {
                  to: "0xBob",
                  estimated_gas_limit: "789",
                },
              };
        });

        const transaction: EvmTransaction = {
          family: "evm",
          mode: "send",
          recipient: "0xBob",
          amount: new BigNumber(1),
          gasLimit: new BigNumber(2),
          chainId: 1,
          nonce: 0,
          gasPrice: new BigNumber(3),
          type: 0,
        };
        const transactionWithData = {
          ...transaction,
          data: Buffer.from("ffff", "hex"),
        };

        expect(await LEDGER_API.getGasEstimation(account, transaction)).toEqual(new BigNumber(789));
        expect(await LEDGER_API.getGasEstimation(account, transactionWithData)).toEqual(
          new BigNumber(1_000_000),
        );
      });
    });

    describe("getFeeData", () => {
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.getFeeData(wrongCurrency, {} as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should return the medium value of the Ledger explorers gas tracker", async () => {
        jest.spyOn(LEDGER_GAS_TRACKER, "getGasOptions").mockImplementation(async () => ({
          slow: {
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(2),
            gasPrice: new BigNumber(3),
            nextBaseFee: new BigNumber(4),
          },
          medium: {
            maxFeePerGas: new BigNumber(5),
            maxPriorityFeePerGas: new BigNumber(6),
            gasPrice: new BigNumber(7),
            nextBaseFee: new BigNumber(8),
          },
          fast: {
            maxFeePerGas: new BigNumber(9),
            maxPriorityFeePerGas: new BigNumber(10),
            gasPrice: new BigNumber(11),
            nextBaseFee: new BigNumber(12),
          },
        }));

        const legacyFeeData = await LEDGER_API.getFeeData(currency, { type: 0 } as any);
        const eip1559FeeData = await LEDGER_API.getFeeData(currency, { type: 2 } as any);

        expect(legacyFeeData).toEqual({
          maxFeePerGas: new BigNumber(5),
          maxPriorityFeePerGas: new BigNumber(6),
          gasPrice: new BigNumber(7),
          nextBaseFee: new BigNumber(8),
        });
        expect(eip1559FeeData).toEqual({
          maxFeePerGas: new BigNumber(5),
          maxPriorityFeePerGas: new BigNumber(6),
          gasPrice: new BigNumber(7),
          nextBaseFee: new BigNumber(8),
        });
      });
    });

    describe("broadcastTransaction", () => {
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.broadcastTransaction(wrongCurrency, "0xSignedTx");
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should return the expected payload", async () => {
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: {
            result: "0xHash",
          },
        }));

        expect(await LEDGER_API.broadcastTransaction(currency, "0xSigneTx")).toEqual("0xHash");
      });
    });

    describe("getBlockByHeight", () => {
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.getBlockByHeight(wrongCurrency, "latest");
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should return the expected payload", async () => {
        jest.spyOn(axios, "request").mockImplementation(async ({ url }) =>
          url?.endsWith("current")
            ? {
                data: {
                  hash: "0xhashLatest",
                  height: 456,
                  time: new Date().toISOString(),
                  txs: ["0xTx3", "0xTx4"],
                },
              }
            : {
                data: {
                  hash: "0xhash",
                  height: 123,
                  time: new Date().toISOString(),
                  txs: ["0xTx1", "0xTx2"],
                },
              },
        );

        expect(await LEDGER_API.getBlockByHeight(currency, 12)).toEqual({
          hash: "0xhash",
          height: 123,
          timestamp: Date.now(),
        });
        expect(await LEDGER_API.getBlockByHeight(currency, "latest")).toEqual({
          hash: "0xhashLatest",
          height: 456,
          timestamp: Date.now(),
        });
      });
    });

    describe("getOptimismAdditionalFees", () => {
      it("should throw with misconfigured currency", async () => {
        try {
          await LEDGER_API.getOptimismAdditionalFees(wrongCurrency, {} as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(LedgerNodeUsedIncorrectly);
        }
      });

      it("should return 0 for an incompatible currency", async () => {
        expect(await LEDGER_API.getOptimismAdditionalFees(currency, {} as any)).toEqual(
          new BigNumber(0),
        );
      });

      it("should return 0 for invalid transaction", async () => {
        const transaction: EvmTransaction = {
          family: "evm",
          mode: "send",
          recipient: "0xINVALID",
          amount: new BigNumber(1),
          gasLimit: new BigNumber(2),
          chainId: 1,
          nonce: 0,
          gasPrice: new BigNumber(3),
          type: 0,
        };

        expect(
          await LEDGER_API.getOptimismAdditionalFees({ ...currency, id: "optimism" }, transaction),
        ).toEqual(new BigNumber("0"));
      });

      it("should return the expected payload", async () => {
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: [
            {
              info: {
                contract: "0x420000000000000000000000000000000000000F",
                data: "0xSerializedTransaction",
                blockNumber: 123,
              },
              response: "100000000",
            },
          ],
        }));

        const transaction: EvmTransaction = {
          family: "evm",
          mode: "send",
          recipient: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
          amount: new BigNumber(1),
          gasLimit: new BigNumber(2),
          chainId: 1,
          nonce: 0,
          gasPrice: new BigNumber(3),
          type: 0,
        };

        expect(
          await LEDGER_API.getOptimismAdditionalFees({ ...currency, id: "optimism" }, transaction),
        ).toEqual(new BigNumber("100000000"));
      });
    });
  });
});
