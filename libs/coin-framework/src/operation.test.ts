import Prando from "prando";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById, getTokenById } from "./currencies";
import {
  isAddressPoisoningOperation,
  isEditableOperation,
  getStuckAccountAndOperation,
} from "./operation";
import { genTokenAccount, genAccount, genOperation } from "./mocks/account";

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
    it("should return false if the currency is not in eth family", () => {
      const account = genAccount("myAccount", { currency: cardano });
      const tokenAccount = genTokenAccount(0, account, lobster);
      const operation = {
        ...genOperation(account, tokenAccount, account.operations, new Prando("")),
        value: new BigNumber(0),
      };

      expect(isEditableOperation(account, operation)).toBe(false);
      expect(isEditableOperation(tokenAccount, operation)).toBe(false);
    });

    it("should return true if the currency is in eth family, the operation is pending and transactionRaw is filled, otherwise, return false", () => {
      const account = genAccount("myAccount", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, account, usdc);
      const operation = {
        ...genOperation(account, tokenAccount, account.operations, new Prando("")),
        value: new BigNumber(0),
        blockHeight: null, // pending transaction
      };
      const transactionRaw = {
        family: "ethereum",
        amount: "1",
        recipient: "MockRecipient",
      };
      expect(isEditableOperation(account, operation)).toBe(false);
      expect(isEditableOperation(tokenAccount, operation)).toBe(false);
      operation.transactionRaw = transactionRaw;
      expect(isEditableOperation(account, operation)).toBe(true);
      expect(isEditableOperation(tokenAccount, operation)).toBe(true);
    });
  });

  describe("getStuckAccountAndOperation", () => {
    it("should return undefined if the pending transaction is not older than 5 minutes", () => {
      const account = genAccount("myAccount", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, account, usdc);
      const transactionRaw = {
        family: "ethereum",
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
        family: "ethereum",
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
        family: "ethereum",
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
});
