import BigNumber from "bignumber.js";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/coin-framework/currencies/index";
import { genAccount, genOperation, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { Operation } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import Prando from "prando";
import { getStuckAccountAndOperation, isEditableOperation } from "../../operation";

const ethereum = getCryptoCurrencyById("ethereum");
const usdc = getTokenById("ethereum/erc20/usd__coin");
const cardano = getCryptoCurrencyById("cardano");
const lobster = getTokenById(
  "cardano/native/8654e8b350e298c80d2451beb5ed80fc9eee9f38ce6b039fb8706bc34c4f4253544552",
);

describe("EVM Family", () => {
  describe("operation.ts", () => {
    describe("isEditableOperation", () => {
      describe("should return false", () => {
        it("if the currency is not in evm family", () => {
          const account = genAccount("myAccount", { currency: cardano });
          const tokenAccount = genTokenAccount(0, account, lobster);
          const operation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            value: new BigNumber(0),
          };

          expect(isEditableOperation(account, operation)).toBe(false);
        });

        it("if the operation is not pending", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const operation: Operation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            value: new BigNumber(0),
            blockHeight: 1,
          };

          expect(isEditableOperation(account, operation)).toBe(false);
        });

        it("if the operation is the FEES operation associated to a token operation", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const operation: Operation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            type: "FEES",
            subOperations: [
              genOperation(account, tokenAccount, account.operations, new Prando("")),
            ],
            value: new BigNumber(0),
            blockHeight: 1,
          };

          expect(isEditableOperation(account, operation)).toBe(false);
        });

        it("if the operation is the FEES operation associated to a nft operation", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const operation: Operation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            type: "FEES",
            nftOperations: [
              genOperation(account, tokenAccount, account.operations, new Prando("")),
            ],
            value: new BigNumber(0),
            blockHeight: 1,
          };

          expect(isEditableOperation(account, operation)).toBe(false);
        });

        it("if the transactionRaw is not filled", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const operation: Operation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            value: new BigNumber(0),
            blockHeight: null, // pending transaction
          };

          expect(isEditableOperation(account, operation)).toBe(false);
        });

        it("if the gasTracker is not filled", () => {
          const evmWithoutGasTracker: CryptoCurrency = {
            ...ethereum,
            ethereumLikeInfo: {
              chainId: 1,
              node: { type: "ledger", explorerId: "eth" },
              gasTracker: undefined,
              explorer: { type: "ledger", explorerId: "eth" },
            },
          };

          const tokenCurrencyWithoutGasTracker: TokenCurrency = {
            ...usdc,
            parentCurrency: evmWithoutGasTracker,
          };

          const account = genAccount("myAccount", { currency: evmWithoutGasTracker });
          const tokenAccount = genTokenAccount(0, account, tokenCurrencyWithoutGasTracker);
          const operation: Operation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            value: new BigNumber(0),
            blockHeight: null, // pending transaction
            transactionRaw: {
              amount: "1",
              recipient: "MockRecipient",
            },
          };

          expect(isEditableOperation(account, operation)).toBe(false);
        });
      });

      describe("should return true", () => {
        it("if the currency is valid evm currency, the operation is pending and transactionRaw is filled", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const operation: Operation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            value: new BigNumber(0),
            blockHeight: null, // pending transaction
            transactionRaw: {
              amount: "1",
              recipient: "MockRecipient",
            },
          };

          expect(isEditableOperation(account, operation)).toBe(true);
        });
      });
    });

    describe("getStuckAccountAndOperation", () => {
      it("should return undefined for non evm account", () => {
        const account = genAccount("myAccount", { currency: cardano });

        expect(getStuckAccountAndOperation(account, undefined)).toBe(undefined);
      });

      it("should return undefined if the pending transaction is not older than 5 minutes", () => {
        const account = genAccount("myAccount", { currency: ethereum });
        const tokenAccount = genTokenAccount(0, account, usdc);
        const transactionRaw = {
          family: "evm",
          amount: "1",
          recipient: "MockRecipient",
        };
        const pendingOperation = {
          ...genOperation(account, tokenAccount, account.operations, new Prando("")),
          transactionRaw,
          blockHeight: null,
          value: new BigNumber(0),
          date: new Date(),
        };
        account.pendingOperations.push(pendingOperation);
        expect(getStuckAccountAndOperation(account, undefined)).toBe(undefined);
      });

      describe("pending transaction is a coin transaction", () => {
        it("should return pending transaction if the pending transaction is older than 5 minutes", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const transactionRaw = {
            family: "evm",
            amount: "1",
            recipient: "MockRecipient",
          };
          const pendingOperation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            transactionRaw,
            blockHeight: null,
            value: new BigNumber(0),
            date: new Date(1986, 0, 1),
            transactionSequenceNumber: 0,
          };
          account.pendingOperations.push(pendingOperation);

          const res = getStuckAccountAndOperation(account, undefined);

          expect(res?.operation.transactionSequenceNumber).toBe(0);
          expect(res?.account?.id).toBe(account.id);
          expect(res?.parentAccount).toBe(undefined);
        });

        it("should return the oldest pending transaction if there are multiple pending transactions. The transactions are sorted by transactionSequenceNumber", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const transactionRaw = {
            family: "evm",
            amount: "1",
            recipient: "MockRecipient",
          };
          const pendingOperation1 = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            transactionRaw,
            blockHeight: null,
            value: new BigNumber(0),
            date: new Date(1986, 0, 1),
            transactionSequenceNumber: 1,
          };
          const pendingOperation2 = {
            ...pendingOperation1,
            transactionSequenceNumber: 0,
          };
          const pendingOperation3 = {
            ...pendingOperation1,
            transactionSequenceNumber: 2,
          };
          account.pendingOperations.push(pendingOperation1, pendingOperation2, pendingOperation3);

          expect(account.pendingOperations.length).toBe(3);

          const res = getStuckAccountAndOperation(account, undefined);

          expect(res?.operation.transactionSequenceNumber).toBe(0);
          expect(res?.account.id).toBe(account.id);
          expect(res?.parentAccount).toBe(undefined);
        });
      });

      describe("pending transaction is a token transaction", () => {
        it("should return pending transaction if the pending transaction is older than 5 minutes", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const transactionRaw = {
            family: "evm",
            amount: "1",
            recipient: "MockRecipient",
            subAccountId: tokenAccount.id,
          };
          const pendingOperation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            transactionRaw,
            blockHeight: null,
            value: new BigNumber(0),
            date: new Date(1986, 0, 1),
            transactionSequenceNumber: 0,
          };
          account.pendingOperations.push(pendingOperation);

          const res = getStuckAccountAndOperation(tokenAccount, account);

          expect(res?.operation.transactionSequenceNumber).toBe(0);
          expect(res?.account?.id).toBe(tokenAccount.id);
          expect(res?.parentAccount?.id).toBe(account.id);
        });

        it("should return the oldest pending transaction if there are multiple pending transactions. The transactions are sorted by transactionSequenceNumber", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const transactionRaw = {
            family: "evm",
            amount: "1",
            recipient: "MockRecipient",
            subAccountId: tokenAccount.id,
          };
          const pendingOperation1 = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            transactionRaw,
            blockHeight: null,
            value: new BigNumber(0),
            date: new Date(1986, 0, 1),
            transactionSequenceNumber: 1,
          };
          const pendingOperation2 = {
            ...pendingOperation1,
            transactionSequenceNumber: 0,
          };
          const pendingOperation3 = {
            ...pendingOperation1,
            transactionSequenceNumber: 2,
          };
          account.pendingOperations.push(pendingOperation1, pendingOperation2, pendingOperation3);

          expect(account.pendingOperations.length).toBe(3);

          const res = getStuckAccountAndOperation(tokenAccount, account);

          expect(res?.operation.transactionSequenceNumber).toBe(0);
          expect(res?.account?.id).toBe(tokenAccount.id);
          expect(res?.parentAccount?.id).toBe(account.id);
        });
      });
    });
  });
});
