import BigNumber from "bignumber.js";
import { Account, Operation } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { GetAccountShapeArg0 } from "../../../bridge/jsHelpers";
import * as synchronization from "../synchronization";
import { decodeAccountId } from "../../../account";
import * as etherscanAPI from "../api/etherscan";
import * as rpcAPI from "../api/rpc.common";
import { makeAccount } from "../testUtils";

const currency: CryptoCurrency = {
  ...findCryptoCurrencyById("ethereum")!,
  ethereumLikeInfo: {
    chainId: 1,
    rpc: "https://my-rpc.com",
    explorer: {
      uri: "https://api.com",
      type: "etherscan",
    },
  },
};
const getAccountShapeParameters: GetAccountShapeArg0 = {
  address: "0xkvn",
  currency,
  derivationMode: "",
  derivationPath: "44'/60'/0'/0/0",
  index: 0,
};
const mockAccount: Account = makeAccount("0xkvn", currency);
const fakeOperation: Operation = {
  id: "js:2:ethereum:0xkvn:-0xH4sH-OUT",
  hash: "0xH4sH",
  accountId: "js:2:ethereum:0xkvn:",
  blockHash:
    "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
  blockHeight: 9,
  recipients: ["0xB0B"],
  senders: ["0xd48f2332Eeed88243Cb6b1D0d65a10368A5370f0"], // johnnyhallyday.eth
  value: new BigNumber(7175807958762144),
  fee: new BigNumber(7175807958762144),
  date: new Date("2022-06-08T00:02:50.000Z"),
  transactionSequenceNumber: 1,
  type: "OUT",
  extra: {},
};

describe("EVM Family", () => {
  describe("synchronization.ts", () => {
    describe("With mocked getAccount", () => {
      beforeEach(() => {
        // Mocking getAccount to prevent network calls
        jest.spyOn(rpcAPI, "getAccount").mockImplementation(() =>
          Promise.resolve({
            blockHeight: 10,
            balance: new BigNumber(100),
            nonce: 1,
          })
        );
      });

      afterAll(() => {
        jest.restoreAllMocks();
      });

      describe("With no transactions fetched", () => {
        beforeAll(() => {
          jest
            .spyOn(etherscanAPI, "getLatestTransactions")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(etherscanAPI?.default, "getLatestTransactions")
            .mockImplementation(() => Promise.resolve([]));
        });

        afterAll(() => {
          jest.restoreAllMocks();
        });

        it("should return an account with a valid id", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any
          );
          expect(decodeAccountId(account.id || "")).toEqual({
            type: "js",
            version: "2",
            currencyId: currency.id,
            xpubOrAddress: "0xkvn",
            derivationMode: "",
          });
        });

        it("should return an account with the correct balance", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any
          );
          expect(account.balance).toEqual(new BigNumber(100));
        });

        it("should return an account with the correct operations count", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any
          );
          expect(account.operationsCount).toBe(1);
        });

        it("should return an account with the correct block height", async () => {
          const account = await synchronization.getAccountShape(
            getAccountShapeParameters,
            {} as any
          );
          expect(account.blockHeight).toBe(10);
        });

        it("should keep the operations from a sync to another", async () => {
          const operations = [fakeOperation];
          const account = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: { ...mockAccount, operations },
            },
            {} as any
          );
          expect(account.operations).toBe(operations);
        });
      });

      describe("With transactions fetched", () => {
        beforeAll(() => {
          jest
            .spyOn(etherscanAPI, "getLatestTransactions")
            .mockImplementation(() => Promise.resolve([fakeOperation]));
          jest
            .spyOn(etherscanAPI?.default, "getLatestTransactions")
            .mockImplementation(() => Promise.resolve([fakeOperation]));
        });

        afterAll(() => {
          jest.restoreAllMocks();
        });

        it("should add the fetched transaction to the operations", async () => {
          const account = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: mockAccount,
            },
            {} as any
          );
          expect(account.operations).toEqual([fakeOperation]);
        });
      });

      describe("With pending operations", () => {
        beforeAll(() => {
          jest
            .spyOn(etherscanAPI, "getLatestTransactions")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(etherscanAPI?.default, "getLatestTransactions")
            .mockImplementation(() => Promise.resolve([]));
          jest
            .spyOn(synchronization, "getOperationStatus")
            .mockImplementation((currency, op) =>
              Promise.resolve(op.hash === "0xH4sH" ? fakeOperation : null)
            );
        });

        afterAll(() => {
          jest.restoreAllMocks();
        });

        it("should add the confirmed pending operation to the operations", async () => {
          const account = await synchronization.getAccountShape(
            {
              ...getAccountShapeParameters,
              initialAccount: {
                ...mockAccount,
                // 2 operations to confirm here, they're differenciated by id
                pendingOperations: [
                  fakeOperation,
                  {
                    ...fakeOperation,
                    hash: "0xN0tH4sH",
                    id: "js:2:ethereum:0xkvn:-0xN0tH4sH-OUT",
                  },
                ],
              },
            },
            {} as any
          );

          expect(account.operations).toEqual([fakeOperation]);
        });
      });
    });
  });
});
