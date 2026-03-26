import { AssertionError, fail } from "assert";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { delay } from "@ledgerhq/live-promise";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import axios from "axios";
import BigNumber from "bignumber.js";
import { Transaction } from "ethers";
import { GasEstimationError } from "../../errors";
import { makeAccount } from "../../fixtures/common.fixtures";
import { Transaction as EvmTransaction } from "../../types";
import { getGasOptions } from "../gasTracker/ledger";
import { createLedgerNodeApi } from "./ledger";

jest.useFakeTimers({ doNotFake: ["setTimeout"] });

jest.mock("axios");
jest.mock("@ledgerhq/live-promise");
jest.mock("../gasTracker/ledger", () => ({
  getGasOptions: jest.fn(),
}));

const mockGetGasOptions = getGasOptions as jest.Mock;

(delay as jest.Mock).mockImplementation(
  () => new Promise(resolve => setTimeout(resolve, 1)), // mocking the delay supposed to happen after each try
);

const currency = {
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {},
} as CryptoCurrency;

const account = makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", currency);

const ledgerConfig = { type: "ledger" as const, explorerId: "eth" as const, retries: 2 };

describe("EVM Family", () => {
  describe("network/node/ledger.ts", () => {
    describe("createLedgerNodeApi / retries", () => {
      it("should retry on fail", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        let attempts = 2;
        const spy = jest.spyOn(axios, "request").mockImplementation(async () => {
          if (attempts) {
            --attempts;
            throw new Error();
          }
          return {
            data: {
              hash: "0xabc",
              block: { hash: "0xblock", height: 1, time: new Date().toISOString() },
              nonce_value: 0,
              gas_price: "0",
              gas_used: "0",
              value: "0",
              status: 1,
              from: "0xfrom",
              to: "0xto",
              transfer_events: [],
            },
          };
        });
        const response = await api.getTransaction(currency, "0xHash");
        expect(response.hash).toEqual("0xabc");
        expect(spy).toHaveBeenCalledTimes(3);
      });

      it("should throw after too many retries", async () => {
        const api = createLedgerNodeApi({ ...ledgerConfig, retries: 2 });
        const SpyError = class SpyError extends Error {};
        let attempts = 3;
        jest.spyOn(axios, "request").mockImplementation(async () => {
          if (attempts) {
            --attempts;
            throw new SpyError();
          }
          return { data: {} };
        });
        try {
          await api.getTransaction(currency, "0xHash");
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
        const api = createLedgerNodeApi(ledgerConfig);
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
            transfer_events: [
              {
                contract: "0xf68c9df95a18b2a5a5fa1124d79eeeffbad0b6fa",
                from: "0xcc4461636684868aab71037b29a11cc643e64500",
                to: "0x970402b253733a1f6f4f3cd1d07420006be2882d",
                count: "20000000000000000000000",
              },
              {
                contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                from: "0x970402b253733a1f6f4f3cd1d07420006be2882d",
                to: "0xcc4461636684868aab71037b29a11cc643e64500",
                count: "1000000",
              },
            ],
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

        const response = await api.getTransaction(currency, "0xHash");
        expect(response).toEqual({
          gasPrice: "83953611012",
          gasUsed: "21000",
          value: "70494048649554430",
          hash: "0x8d5ef4d7673fbfa6a4755cdfdb913742c47c7fdac2d214046387bbcbf10957c9",
          blockHeight: 17586913,
          blockHash: "0x6db17db08345729953a1408a56dcc588aa3d23e8cc917f2624b8bf047148cce2",
          nonce: 271392,
          status: 1,
          from: "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
          to: "0x6d2e03b7effeae98bd302a9f836d0d6ab0002766",
          erc20Transfers: [
            {
              asset: {
                type: "erc20",
                assetReference: "0xF68C9Df95a18B2A5a5fa1124d79EEEffBaD0B6Fa",
              },
              from: "0xcc4461636684868AaB71037b29a11cC643E64500",
              to: "0x970402B253733A1f6F4f3cd1d07420006be2882D",
              value: "20000000000000000000000",
            },
            {
              asset: {
                type: "erc20",
                assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              },
              from: "0x970402B253733A1f6F4f3cd1d07420006be2882D",
              to: "0xcc4461636684868AaB71037b29a11cC643E64500",
              value: "1000000",
            },
          ],
        });
      });
    });

    describe("getCoinBalance", () => {
      it("should return the expected payload", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: { balance: "6969" },
        }));

        expect(await api.getCoinBalance(currency, "0xkvn")).toEqual(new BigNumber("6969"));
      });
    });

    describe("getTokenBalance", () => {
      it("should return the expected payload", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: [
            { address: "0xkvn", contract: "0xusdc", balance: "6969" },
            { address: "0xkvn", contract: "0xsquid", balance: "420" },
          ],
        }));

        expect(await api.getTokenBalance(currency, "0xusdc", "0xkvn")).toEqual(
          new BigNumber("6969"),
        );
      });
    });

    describe("getTransactionCount", () => {
      it("should return the expected payload", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: { address: "0xkvn", nonce: 123 },
        }));

        expect(await api.getTransactionCount(currency, "0xkvn")).toEqual(123);
      });
    });

    describe("getGasEstimation", () => {
      it("should throw GasEstimationError on failure", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        jest.spyOn(axios, "request").mockImplementation(async () => {
          throw new Error();
        });

        try {
          await api.getGasEstimation(account, {} as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(GasEstimationError);
        }
      });

      it("should throw GasEstimationError if request throws ECONNABORTED", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        jest
          .spyOn(axios, "request")
          .mockImplementation(() => Promise.reject({ code: "ECONNABORTED" }));

        try {
          await api.getGasEstimation(account, {} as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(GasEstimationError);
        }
      });

      it("should return the expected payload", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
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

        expect(await api.getGasEstimation(account, transaction)).toEqual(new BigNumber(789));
        expect(await api.getGasEstimation(account, transactionWithData)).toEqual(
          new BigNumber(1_000_000),
        );
      });
    });

    describe("getFeeData", () => {
      it("should return the fee data based on the transaction's feesStrategy", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        mockGetGasOptions.mockImplementation(async () => ({
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

        const slowFeeData = await api.getFeeData(currency, {
          type: 2,
          feesStrategy: "slow",
        } as any);
        const mediumFeeData = await api.getFeeData(currency, {
          type: 2,
          feesStrategy: "medium",
        } as any);
        const fastFeeData = await api.getFeeData(currency, {
          type: 2,
          feesStrategy: "fast",
        } as any);

        expect(slowFeeData).toEqual({
          maxFeePerGas: new BigNumber(1),
          maxPriorityFeePerGas: new BigNumber(2),
          gasPrice: new BigNumber(3),
          nextBaseFee: new BigNumber(4),
        });
        expect(mediumFeeData).toEqual({
          maxFeePerGas: new BigNumber(5),
          maxPriorityFeePerGas: new BigNumber(6),
          gasPrice: new BigNumber(7),
          nextBaseFee: new BigNumber(8),
        });
        expect(fastFeeData).toEqual({
          maxFeePerGas: new BigNumber(9),
          maxPriorityFeePerGas: new BigNumber(10),
          gasPrice: new BigNumber(11),
          nextBaseFee: new BigNumber(12),
        });
      });

      it("should return medium fee data if feesStrategy is not provided", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        mockGetGasOptions.mockImplementation(async () => ({
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

        const feeData = await api.getFeeData(currency, { type: 2 } as any);

        expect(feeData).toEqual({
          maxFeePerGas: new BigNumber(5),
          maxPriorityFeePerGas: new BigNumber(6),
          gasPrice: new BigNumber(7),
          nextBaseFee: new BigNumber(8),
        });
      });
    });

    describe("broadcastTransaction", () => {
      it("should return the expected payload", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: {
            result: "0xHash",
          },
        }));

        expect(await api.broadcastTransaction(currency, "0xSigneTx")).toEqual("0xHash");
      });

      it("should include mevProtected=true in the request parameters when specified", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        const mockRequest = jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: {
            result: "0xHash",
          },
        }));

        await api.broadcastTransaction(currency, "0xSignedTx", { mevProtected: true });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              mevProtected: true,
            }),
          }),
        );

        mockRequest.mockRestore();
      });

      it("should include source headers when source is provided", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        const mockRequest = jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: {
            result: "0xHash",
          },
        }));

        await api.broadcastTransaction(currency, "0xSignedTx", {
          mevProtected: false,
          source: { type: "live-app", name: "test-manifest-id" },
        });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: expect.objectContaining({
              "X-Ledger-Source-Type": "live-app",
              "X-Ledger-Source-Name": "test-manifest-id",
            }),
          }),
        );

        mockRequest.mockRestore();
      });

      it("should not include source headers when source is not provided", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        const mockRequest = jest.spyOn(axios, "request").mockImplementationOnce(async () => ({
          data: {
            result: "0xHash",
          },
        }));

        await api.broadcastTransaction(currency, "0xSignedTx", { mevProtected: false });

        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: {
              "X-Ledger-Client-Version": expect.any(String),
            },
          }),
        );

        mockRequest.mockRestore();
      });
    });

    describe("getBlockByHeight", () => {
      it("should return the expected payload", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        jest.spyOn(axios, "request").mockImplementation(async ({ url }) => {
          if (url?.endsWith("current")) {
            return {
              data: {
                hash: "0xhashLatest",
                height: 456,
                time: new Date().toISOString(),
                txs: ["0xTx3", "0xTx4"],
                prevHash: "0xparentHashLatest",
              },
            };
          }
          return {
            data: [
              {
                hash: "0xhash",
                height: 123,
                time: new Date().toISOString(),
                txs: ["0xTx1", "0xTx2"],
                prevHash: "0xparentHash",
              },
            ],
          };
        });

        expect(await api.getBlockByHeight(currency, 12)).toEqual({
          hash: "0xhash",
          height: 123,
          timestamp: Date.now(),
          parentHash: "0xparentHash",
          transactionHashes: ["0xTx1", "0xTx2"],
        });
        expect(await api.getBlockByHeight(currency, "latest")).toEqual({
          hash: "0xhashLatest",
          height: 456,
          timestamp: Date.now(),
          parentHash: "0xparentHashLatest",
          transactionHashes: ["0xTx3", "0xTx4"],
        });
      });
    });

    describe("getOptimismAdditionalFees", () => {
      it("should return 0 for an incompatible currency", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        expect(await api.getOptimismAdditionalFees(currency, {} as any)).toEqual(new BigNumber(0));
      });

      it("should return the expected payload", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
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

        const transaction = Transaction.from({
          to: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
          value: 1n,
          gasLimit: 2n,
          chainId: 1,
          nonce: 0,
          gasPrice: 3n,
          type: 0,
          signature: {
            r: "0xffffffffffffffffffffffffffffffffffffffff",
            s: "0xffffffffffffffffffffffffffffffffffffffff",
            v: 27,
          },
        });

        expect(
          await api.getOptimismAdditionalFees(
            { ...currency, id: "optimism" },
            transaction.serialized,
          ),
        ).toEqual(new BigNumber("100000000"));
      });
    });

    describe("getScrollAdditionalFees", () => {
      it("should return 0 for an incompatible currency", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
        expect(await api.getScrollAdditionalFees(currency, {} as any)).toEqual(new BigNumber(0));
      });

      it("should return the expected payload", async () => {
        const api = createLedgerNodeApi(ledgerConfig);
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

        const transaction = Transaction.from({
          to: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
          value: 1n,
          gasLimit: 2n,
          chainId: 1,
          nonce: 0,
          gasPrice: 3n,
          type: 0,
          signature: {
            r: "0xffffffffffffffffffffffffffffffffffffffff",
            s: "0xffffffffffffffffffffffffffffffffffffffff",
            v: 27,
          },
        });

        expect(
          await api.getScrollAdditionalFees({ ...currency, id: "scroll" }, transaction.serialized),
        ).toEqual(new BigNumber("100000000"));
      });
    });
  });
});
