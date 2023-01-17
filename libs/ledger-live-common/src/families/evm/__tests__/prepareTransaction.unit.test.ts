import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { makeAccount, makeTokenAccount } from "../testUtils";
import { Transaction as EvmTransaction } from "../types";
import ERC20ABI from "../abis/erc20.abi.json";
import * as rpcAPI from "../api/rpc.common";
import {
  prepareForSignOperation,
  prepareTransaction,
} from "../prepareTransaction";

const currency = getCryptoCurrencyById("ethereum");
const tokenAccount = makeTokenAccount(
  "0xkvn",
  getTokenById("ethereum/erc20/usd__coin")
);
const account = makeAccount("0xkvn", currency, [tokenAccount]);
const transaction: EvmTransaction = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  gasPrice: new BigNumber(0),
  gasLimit: new BigNumber(21000),
  nonce: 0,
  chainId: 1,
};
const tokenTransaction: EvmTransaction = {
  ...transaction,
  subAccountId: tokenAccount.id,
};
const expectedData = (recipient: string, amount: BigNumber): Buffer =>
  Buffer.from(
    new ethers.utils.Interface(ERC20ABI)
      .encodeFunctionData("transfer", [recipient, amount.toFixed()])
      .slice(2),
    "hex"
  );

describe("EVM Family", () => {
  describe("prepareTransaction.ts", () => {
    beforeEach(() => {
      // These mocks will be overriden in some tests
      jest
        .spyOn(rpcAPI, "getGasEstimation")
        .mockImplementation(async () => new BigNumber(21000));
      // These mocks will be overriden in some tests
      jest.spyOn(rpcAPI, "getFeesEstimation").mockImplementation(async () => ({
        gasPrice: new BigNumber(1),
        maxFeePerGas: new BigNumber(1),
        maxPriorityFeePerGas: new BigNumber(1),
      }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("prepareTransaction", () => {
      describe("Coins", () => {
        it("should not go to gasEstimation when recipient has an error", async () => {
          const tx = await prepareTransaction(account, {
            ...transaction,
            recipient: "notValid",
          });

          expect(tx).toEqual({
            ...transaction,
            recipient: "notValid",
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            type: 2,
          });
          expect(rpcAPI.getGasEstimation).not.toBeCalled();
        });

        it("should not go to gasEstimation when amount has an error", async () => {
          const tx = await prepareTransaction(account, {
            ...transaction,
            amount: new BigNumber(0),
          });

          expect(tx).toEqual({
            ...transaction,
            amount: new BigNumber(0),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            type: 2,
          });
          expect(rpcAPI.getGasEstimation).not.toBeCalled();
        });

        it("should return an EIP1559 coin transaction", async () => {
          const tx = await prepareTransaction(account, transaction);

          expect(tx).toEqual({
            ...transaction,
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            type: 2,
          });
        });

        it("should return a legacy coin transaction", async () => {
          jest
            .spyOn(rpcAPI, "getFeesEstimation")
            .mockImplementationOnce(async () => ({
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

        it("should create a coin transaction using all amount in the account", async () => {
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

        it("should do a gas estimation when data has been added to the coin transaction", async () => {
          jest
            .spyOn(rpcAPI, "getGasEstimation")
            .mockImplementationOnce(async () => new BigNumber(12));

          const accountWithBalance = {
            ...account,
            balance: new BigNumber(4206900),
          };
          const tx = await prepareTransaction(accountWithBalance, {
            ...transaction,
            data: Buffer.from("Sm4rTC0ntr4ct", "hex"),
          });

          expect(tx).toEqual({
            ...transaction,
            data: Buffer.from("Sm4rTC0ntr4ct", "hex"),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasLimit: new BigNumber(12),
            type: 2,
          });
        });
      });

      describe("Tokens", () => {
        it("should not go to gasEstimation when recipient has an error", async () => {
          const tx = await prepareTransaction(account, {
            ...tokenTransaction,
            recipient: "notValid",
          });

          expect(tx).toEqual({
            ...tokenTransaction,
            recipient: "notValid",
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            type: 2,
          });
          expect(rpcAPI.getGasEstimation).not.toBeCalled();
        });

        it("should not go to gasEstimation when amount has an error", async () => {
          const tx = await prepareTransaction(account, {
            ...tokenTransaction,
            amount: new BigNumber(0),
          });

          expect(tx).toEqual({
            ...tokenTransaction,
            amount: new BigNumber(0),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            type: 2,
          });
          expect(rpcAPI.getGasEstimation).not.toBeCalled();
        });

        it("should go to gasEstimation when amount is 0 but it's send max with token transaction", async () => {
          jest
            .spyOn(rpcAPI, "getGasEstimation")
            .mockImplementationOnce(async () => new BigNumber(12));

          const tokenAccountWithBalance = {
            ...tokenAccount,
            balance: new BigNumber(200),
          };
          const account2 = {
            ...account,
            subAccounts: [tokenAccountWithBalance],
          };

          const tx = await prepareTransaction(account2, {
            ...tokenTransaction,
            amount: new BigNumber(0),
            useAllAmount: true,
            subAccountId: tokenAccountWithBalance.id,
          });

          expect(tx).toEqual({
            ...tokenTransaction,
            amount: new BigNumber(0),
            useAllAmount: true,
            subAccountId: tokenAccountWithBalance.id,
            data: expectedData(
              tokenTransaction.recipient,
              tokenAccountWithBalance.balance
            ),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            gasPrice: undefined,
            gasLimit: new BigNumber(12),
            type: 2,
          });
          expect(rpcAPI.getGasEstimation).toBeCalled();
        });

        it("should go to gas estimation with a transaction without 0 amount", async () => {
          jest
            .spyOn(rpcAPI, "getGasEstimation")
            .mockImplementationOnce(async () => new BigNumber(12));

          const tokenAccountWithBalance = {
            ...tokenAccount,
            balance: new BigNumber(200),
          };
          const account2 = {
            ...account,
            subAccounts: [tokenAccountWithBalance],
          };

          await prepareTransaction(account2, {
            ...tokenTransaction,
            useAllAmount: true,
            subAccountId: tokenAccountWithBalance.id,
          });

          expect(rpcAPI.getGasEstimation).toBeCalledWith(
            account2,
            expect.objectContaining({
              recipient: tokenAccount.token.contractAddress,
              amount: new BigNumber(0),
              data: expectedData(
                tokenTransaction.recipient,
                tokenAccountWithBalance.balance
              ),
            })
          );
        });

        it("should return an EIP1559 token transaction", async () => {
          const tokenAccountWithBalance = {
            ...tokenAccount,
            balance: new BigNumber(200),
          };
          const account2 = {
            ...account,
            subAccounts: [tokenAccountWithBalance],
          };
          const tx = await prepareTransaction(account2, tokenTransaction);

          expect(tx).toEqual({
            ...tokenTransaction,
            data: expectedData(
              tokenTransaction.recipient,
              tokenTransaction.amount
            ),
            maxFeePerGas: new BigNumber(1),
            maxPriorityFeePerGas: new BigNumber(1),
            type: 2,
          });
        });

        it("should return a legacy token transaction", async () => {
          jest
            .spyOn(rpcAPI, "getFeesEstimation")
            .mockImplementationOnce(async () => ({
              gasPrice: new BigNumber(1),
              maxFeePerGas: null,
              maxPriorityFeePerGas: null,
            }));

          const tokenAccountWithBalance = {
            ...tokenAccount,
            balance: new BigNumber(200),
          };
          const account2 = {
            ...account,
            subAccounts: [tokenAccountWithBalance],
          };
          const tx = await prepareTransaction(account2, tokenTransaction);

          expect(tx).toEqual({
            ...tokenTransaction,
            data: expectedData(
              tokenTransaction.recipient,
              tokenTransaction.amount
            ),
            gasPrice: new BigNumber(1),
            type: 0,
          });
        });
      });
    });

    describe("prepareForSignOperation", () => {
      beforeEach(() => {
        jest
          .spyOn(rpcAPI, "getTransactionCount")
          .mockImplementation(() => Promise.resolve(10));
      });
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should not change a coin transaction", async () => {
        expect(await prepareForSignOperation(account, transaction)).toEqual({
          ...transaction,
          nonce: 10,
        });
      });

      it("should update a token transaction with the correct recipient", async () => {
        expect(
          await prepareForSignOperation(account, tokenTransaction)
        ).toEqual({
          ...tokenTransaction,
          amount: new BigNumber(0),
          recipient: tokenAccount.token.contractAddress,
          nonce: 10,
        });
      });
    });
  });
});
