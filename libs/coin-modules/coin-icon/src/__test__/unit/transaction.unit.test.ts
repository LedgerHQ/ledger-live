import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "../../transaction";

jest.mock("@ledgerhq/coin-framework/account", () => ({
  getAccountCurrency: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/currencies", () => ({
  formatCurrencyUnit: jest.fn(),
}));

describe("Transaction Utilities", () => {
  describe("formatTransaction", () => {
    it("should format a transaction correctly", () => {
      const transaction = {
        mode: "send",
        amount: new BigNumber(1000),
        recipient: "recipient-address",
        useAllAmount: false,
      } as any;
      const account = {
        currency: {
          units: [{ code: "ICX", name: "ICX", magnitude: 18 }],
        },
      } as any;

      (getAccountCurrency as jest.Mock).mockReturnValue(account.currency);
      (formatCurrencyUnit as jest.Mock).mockReturnValue("1 ICX");

      const formatted = formatTransaction(transaction, account);
      expect(formatted).toBe("\nSEND  1 ICX\nTO recipient-address");
    });

    it("should handle useAllAmount correctly", () => {
      const transaction = {
        mode: "send",
        amount: new BigNumber(0),
        recipient: "recipient-address",
        useAllAmount: true,
      } as any;
      const account = {
        currency: {
          units: [{ code: "ICX", name: "ICX", magnitude: 8 }],
        },
      };

      (getAccountCurrency as jest.Mock).mockReturnValue(account.currency);

      const formatted = formatTransaction(transaction, account as Account);
      expect(formatted).toBe("\nSEND MAX\nTO recipient-address");
    });
  });

  describe("fromTransactionRaw", () => {
    it("should convert a raw transaction to a transaction", () => {
      const rawTransaction = {
        family: "ICX",
        mode: "send",
        amount: "1000",
        recipient: "recipient-address",
        fees: "10",
        stepLimit: "1000",
      } as any;

      const transaction = fromTransactionRaw(rawTransaction);
      expect(transaction).toEqual({
        family: "ICX",
        mode: "send",
        amount: new BigNumber(1000),
        recipient: "recipient-address",
        fees: new BigNumber(10),
        stepLimit: new BigNumber(1000),
      });
    });

    it("should handle null and undefined fields", () => {
      const rawTransaction = {
        family: "ICX",
        mode: "send",
        amount: "1000",
        recipient: "recipient-address",
        fees: null,
        stepLimit: undefined,
      } as any;

      const transaction = fromTransactionRaw(rawTransaction);
      expect(transaction).toEqual({
        family: "ICX",
        mode: "send",
        amount: new BigNumber(1000),
        recipient: "recipient-address",
        fees: null,
        stepLimit: undefined,
      });
    });
  });

  describe("toTransactionRaw", () => {
    it("should convert a transaction to a raw transaction", () => {
      const transaction = {
        family: "ICX",
        mode: "send",
        amount: new BigNumber(1000),
        recipient: "recipient-address",
        fees: new BigNumber(10),
        stepLimit: new BigNumber(1000),
      } as any;

      const rawTransaction = toTransactionRaw(transaction);
      expect(rawTransaction).toEqual({
        family: "ICX",
        mode: "send",
        amount: "1000",
        recipient: "recipient-address",
        fees: "10",
        stepLimit: "1000",
      });
    });

    it("should handle null and undefined fields", () => {
      const transaction = {
        family: "ICX",
        mode: "send",
        amount: new BigNumber(1000),
        recipient: "recipient-address",
        fees: null,
        stepLimit: undefined,
      } as any;

      const rawTransaction = toTransactionRaw(transaction);
      expect(rawTransaction).toEqual({
        family: "ICX",
        mode: "send",
        amount: "1000",
        recipient: "recipient-address",
        fees: null,
        stepLimit: undefined,
      });
    });
  });
});
