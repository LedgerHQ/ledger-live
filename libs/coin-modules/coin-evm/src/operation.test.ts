import { genAccount, genOperation, genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import Prando from "prando";
import lobsterTokenData from "./fixtures/cardano-native-8654e8b350e298c80d2451beb5ed80fc9eee9f38ce6b039fb8706bc34c4f4253544552.json";
import usdCoinTokenData from "./fixtures/ethereum-erc20-usd__coin.json";
import { getStuckAccountAndOperation, isEditableOperation } from "./operation";

const ethereum = getCryptoCurrencyById("ethereum");
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const usdc = usdCoinTokenData as TokenCurrency;

const cardano = getCryptoCurrencyById("cardano");

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const lobster = lobsterTokenData as TokenCurrency;

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

          expect(isEditableOperation(account, operation, () => true)).toBe(false);
        });

        it("if the operation is not pending", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const operation: Operation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            value: new BigNumber(0),
            blockHeight: 1,
          };

          expect(isEditableOperation(account, operation, () => true)).toBe(false);
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

          expect(isEditableOperation(account, operation, () => true)).toBe(false);
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

          expect(isEditableOperation(account, operation, () => true)).toBe(false);
        });

        it("if the transactionRaw is not filled", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          const operation: Operation = {
            ...genOperation(account, tokenAccount, account.operations, new Prando("")),
            value: new BigNumber(0),
            blockHeight: null, // pending transaction
          };

          expect(isEditableOperation(account, operation, () => true)).toBe(false);
        });

        it("if the gasTracker is not filled", () => {
          const evmWithoutGasTracker: CryptoCurrency = {
            ...ethereum,
            ethereumLikeInfo: {
              chainId: 1,
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

          expect(isEditableOperation(account, operation, () => false)).toBe(false);
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

          expect(isEditableOperation(account, operation, () => true)).toBe(true);
        });
      });
    });

    describe("getStuckAccountAndOperation", () => {
      it("should return undefined for non evm account", () => {
        const account = genAccount("myAccount", { currency: cardano });

        expect(getStuckAccountAndOperation(account, undefined, () => true)).toBe(undefined);
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
        expect(getStuckAccountAndOperation(account, undefined, () => true)).toBe(undefined);
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
            transactionSequenceNumber: new BigNumber(0),
          };
          account.pendingOperations.push(pendingOperation);

          const res = getStuckAccountAndOperation(account, undefined, () => true);

          expect(res?.operation.transactionSequenceNumber).toEqual(new BigNumber(0));
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
            transactionSequenceNumber: new BigNumber(1),
          };
          const pendingOperation2 = {
            ...pendingOperation1,
            transactionSequenceNumber: new BigNumber(0),
          };
          const pendingOperation3 = {
            ...pendingOperation1,
            transactionSequenceNumber: new BigNumber(2),
          };
          account.pendingOperations.push(pendingOperation1, pendingOperation2, pendingOperation3);

          expect(account.pendingOperations.length).toBe(3);

          const res = getStuckAccountAndOperation(account, undefined, () => true);

          expect(res?.operation.transactionSequenceNumber).toEqual(new BigNumber(0));
          expect(res?.account.id).toBe(account.id);
          expect(res?.parentAccount).toBe(undefined);
        });
      });

      describe("pending transaction is a token transaction", () => {
        it("should return pending transaction if the pending transaction is older than 5 minutes", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          account.subAccounts = [tokenAccount];
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
            transactionSequenceNumber: new BigNumber(0),
          };
          account.pendingOperations.push(pendingOperation);

          const res = getStuckAccountAndOperation(tokenAccount, account, () => true);

          expect(res?.operation.transactionSequenceNumber).toEqual(new BigNumber(0));
          expect(res?.account?.id).toBe(tokenAccount.id);
          expect(res?.parentAccount?.id).toBe(account.id);
        });

        it("should return the oldest pending transaction if there are multiple pending transactions. The transactions are sorted by transactionSequenceNumber", () => {
          const account = genAccount("myAccount", { currency: ethereum });
          const tokenAccount = genTokenAccount(0, account, usdc);
          account.subAccounts = [tokenAccount];
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
            transactionSequenceNumber: new BigNumber(1),
          };
          const pendingOperation2 = {
            ...pendingOperation1,
            transactionSequenceNumber: new BigNumber(0),
          };
          const pendingOperation3 = {
            ...pendingOperation1,
            transactionSequenceNumber: new BigNumber(2),
          };
          account.pendingOperations.push(pendingOperation1, pendingOperation2, pendingOperation3);

          expect(account.pendingOperations.length).toBe(3);

          const res = getStuckAccountAndOperation(tokenAccount, account, () => true);

          expect(res?.operation.transactionSequenceNumber).toEqual(new BigNumber(0));
          expect(res?.account?.id).toBe(tokenAccount.id);
          expect(res?.parentAccount?.id).toBe(account.id);
        });
      });
    });
  });
});
