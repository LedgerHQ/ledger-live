import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import Prando from "prando";
import { getCryptoCurrencyById, getTokenById } from "./currencies";
import { genAccount, genOperation, genTokenAccount } from "./mocks/account";
import { isAddressPoisoningOperation, isOldestPendingOperation } from "./operation";

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
