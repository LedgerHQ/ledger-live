import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import Prando from "prando";
import { getCryptoCurrencyById, getTokenById } from "./currencies";
import { genAccount, genOperation, genTokenAccount } from "./mocks/account";
import {
  getStuckAccountAndOperation,
  isAddressPoisoningOperation,
  isEditableOperation,
  isOldestPendingOperation,
} from "./operation";

const ethereum = getCryptoCurrencyById("ethereum");
const usdc = getTokenById("ethereum/erc20/usd__coin");
const cardano = getCryptoCurrencyById("cardano");
const lobster = getTokenById(
  "cardano/native/8654e8b350e298c80d2451beb5ed80fc9eee9f38ce6b039fb8706bc34c4f4253544552",
);

describe("Operation.ts", () => {
  describe("isPoisoningAddressOperation", () => {
    it("should detect a token operation with 0 amount with the correct currency", () => {
      const account = genAccount("myAccount", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, account, usdc);
      const operation = {
        ...genOperation(account, tokenAccount, account.operations, new Prando("")),
        value: new BigNumber(0),
      };

      expect(isAddressPoisoningOperation(operation, tokenAccount)).toBe(true);
    });

    it("shouldn't detect a token operation with 0 amount with the wrong currency", () => {
      const account = genAccount("myAccount", { currency: cardano });
      const tokenAccount = genTokenAccount(0, account, lobster);
      const operation = {
        ...genOperation(account, tokenAccount, account.operations, new Prando("")),
        value: new BigNumber(0),
      };

      expect(isAddressPoisoningOperation(operation, tokenAccount)).toBe(false);
    });

    it("shouldn't detect a token operation with more than 0 amount with the correct currency", () => {
      const account = genAccount("myAccount", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, account, usdc);
      const operation = {
        ...genOperation(account, tokenAccount, account.operations, new Prando("")),
        value: new BigNumber(1),
      };

      expect(isAddressPoisoningOperation(operation, tokenAccount)).toBe(false);
    });

    it("shouldn't detect a token operation with more than 0 amount with the wrong currency", () => {
      const account = genAccount("myAccount", { currency: cardano });
      const tokenAccount = genTokenAccount(0, account, lobster);
      const operation = {
        ...genOperation(account, tokenAccount, account.operations, new Prando("")),
        value: new BigNumber(1),
      };

      expect(isAddressPoisoningOperation(operation, tokenAccount)).toBe(false);
    });

    it("shouldn't break if the account provided isn't a tokenAccount", () => {
      const account = genAccount("myAccount", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, account, lobster);
      const operation = {
        ...genOperation(account, tokenAccount, account.operations, new Prando("")),
        value: new BigNumber(1),
      };

      expect(isAddressPoisoningOperation(operation, account)).toBe(false);
    });
  });

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

      it("if the explorer is not filled", () => {
        const evmWithoutExplorer: CryptoCurrency = {
          ...ethereum,
          ethereumLikeInfo: {
            chainId: 1,
            node: { type: "ledger", explorerId: "eth" },
            gasTracker: { type: "ledger", explorerId: "eth" },
            explorer: undefined,
          },
        };

        const tokenCurrencyWithoutExplorer: TokenCurrency = {
          ...usdc,
          parentCurrency: evmWithoutExplorer,
        };

        const account = genAccount("myAccount", { currency: evmWithoutExplorer });
        const tokenAccount = genTokenAccount(0, account, tokenCurrencyWithoutExplorer);
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
      expect(
        getStuckAccountAndOperation(account, undefined)?.operation.transactionSequenceNumber,
      ).toBe(0);
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
      expect(
        getStuckAccountAndOperation(account, undefined)?.operation.transactionSequenceNumber,
      ).toBe(0);
    });
  });

  describe("isOldestPendingOperation", () => {
    const account = genAccount("myAccount", { currency: ethereum });

    const transactionRaw = {
      family: "evm",
      amount: "1",
      recipient: "MockRecipient",
    };
    const pendingCoinOperation0: Operation = {
      ...genOperation(account, account, account.operations, new Prando("")),
      transactionRaw,
      blockHeight: null,
      value: new BigNumber(0),
      date: new Date(1986, 0, 1),
      transactionSequenceNumber: 0,
    };
    const pendingCoinOperation1: Operation = {
      ...pendingCoinOperation0,
      transactionSequenceNumber: 1,
    };
    const pendingCoinOperation2: Operation = {
      ...pendingCoinOperation1,
      transactionSequenceNumber: 2,
    };
    it("should return true if there are no pending operations", () => {
      const testAccount = { ...account, pendingOperations: [] };

      expect(isOldestPendingOperation(testAccount, 0)).toBe(true);
    });

    it("should return true if the given nonce is the same as the transactionSequenceNumber of the only pending operation", () => {
      const testAccount = { ...account, pendingOperations: [pendingCoinOperation0] };

      expect(isOldestPendingOperation(testAccount, 0)).toBe(true);
    });

    it("should return true if the given nonce is less than the transactionSequenceNumber of any pending operation", () => {
      const testAccount = {
        ...account,
        pendingOperations: [pendingCoinOperation1, pendingCoinOperation2],
      };

      expect(isOldestPendingOperation(testAccount, 0)).toBe(true);
    });

    it("should return false if the given nonce is greater than the transactionSequenceNumber of all pending operations", () => {
      const testAccount = {
        ...account,
        pendingOperations: [pendingCoinOperation0, pendingCoinOperation1],
      };

      expect(isOldestPendingOperation(testAccount, 2)).toBe(false);
    });

    it("should return false if there is a pending operation with a lower transactionSequenceNumber than the given nonce", () => {
      const testAccount = {
        ...account,
        pendingOperations: [pendingCoinOperation0, pendingCoinOperation1],
      };

      expect(isOldestPendingOperation(testAccount, 1)).toBe(false);
    });
  });
});
