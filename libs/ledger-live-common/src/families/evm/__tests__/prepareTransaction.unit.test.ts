import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { prepareTransaction } from "../prepareTransaction";
import { Transaction as EvmTransaction } from "../types";
import { makeAccount } from "../testUtils";
import * as API from "../api/rpc.common";

const currency = findCryptoCurrencyById("ethereum")!;
const account: Account = makeAccount("0xkvn", currency);
const transaction: EvmTransaction = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0xkvn",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  gasPrice: new BigNumber(0),
  gasLimit: new BigNumber(21000),
  nonce: 0,
  chainId: 1,
};

describe("EVM Family", () => {
  describe("prepareTransaction.ts", () => {
    beforeAll(() => {
      jest
        .spyOn(API, "getGasEstimation")
        .mockImplementation(async () => new BigNumber(21000));
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    describe("prepareTransaction", () => {
      it("should return an EIP1559 transaction", async () => {
        jest.spyOn(API, "getFeesEstimation").mockImplementation(async () => ({
          gasPrice: new BigNumber(1),
          maxFeePerGas: new BigNumber(1),
          maxPriorityFeePerGas: new BigNumber(1),
        }));

        const tx = await prepareTransaction(account, transaction);

        expect(tx).toEqual({
          ...transaction,
          maxFeePerGas: new BigNumber(1),
          maxPriorityFeePerGas: new BigNumber(1),
          type: 2,
        });
      });

      it("should return an legacy transaction", async () => {
        jest.spyOn(API, "getFeesEstimation").mockImplementation(async () => ({
          gasPrice: new BigNumber(1),
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
        }));

        const tx = await prepareTransaction(account, transaction);

        expect(tx).toEqual({
          ...transaction,
          gasPrice: new BigNumber(1),
          type: 0,
        });
      });

      it("should create a transaction using all amount in the account", async () => {
        jest.spyOn(API, "getFeesEstimation").mockImplementation(async () => ({
          gasPrice: null,
          maxFeePerGas: new BigNumber(1),
          maxPriorityFeePerGas: new BigNumber(1),
        }));
        const accountWithBalance = {
          ...account,
          balance: new BigNumber(4206900),
        };
        const transactionWithUseAllAmount = {
          ...transaction,
          useAllAmount: true,
        };

        const tx = await prepareTransaction(
          accountWithBalance,
          transactionWithUseAllAmount
        );
        const estimatedFees = new BigNumber(21000); // 21000 gasLimit * 1 maxFeePerGas

        expect(tx).toEqual({
          ...transactionWithUseAllAmount,
          amount: accountWithBalance.balance.minus(estimatedFees),
          maxFeePerGas: new BigNumber(1),
          maxPriorityFeePerGas: new BigNumber(1),
          type: 2,
        });
      });
    });
  });
});
