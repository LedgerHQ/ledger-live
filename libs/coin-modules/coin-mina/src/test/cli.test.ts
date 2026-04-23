import { DeepPartial } from "@ledgerhq/coin-module-framework/test/utils";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import makeCliTools from "./cli";

describe("cli-transaction", () => {
  const { options, inferAccounts, inferTransactions } = makeCliTools();

  describe("options", () => {
    it("should define memo and delegateAddress options", () => {
      expect(options).toEqual([
        { name: "memo", type: String, desc: "mina: set a memo" },
        { name: "delegateAddress", type: String, desc: "mina: delegate to a validator" },
      ]);
    });
  });

  describe("inferAccounts", () => {
    it("should return account in array for mina family", () => {
      const account: DeepPartial<Account> = { currency: { family: "mina" } };
      const result = inferAccounts(account as Account);
      expect(result).toEqual([account]);
    });

    it("should throw for non-mina family", () => {
      const account: DeepPartial<Account> = { currency: { family: "bitcoin" } };
      expect(() => inferAccounts(account as Account)).toThrow();
    });
  });

  describe("inferTransactions", () => {
    const baseTxn: DeepPartial<Transaction> = { family: "mina" };

    it("should set memo from opts", () => {
      const result = inferTransactions(
        [{ account: {} as DeepPartial<Account> as Account, transaction: baseTxn as Transaction }],
        { memo: "hello" },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ family: "mina", memo: "hello" }));
    });

    it("should create delegation transaction when delegateAddress is provided", () => {
      const result = inferTransactions(
        [{ account: {} as DeepPartial<Account> as Account, transaction: baseTxn as Transaction }],
        { delegateAddress: "B62qdelegate" },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          family: "mina",
          txType: "stake",
          recipient: "B62qdelegate",
        }),
      );
    });

    it("should throw for non-mina family transaction", () => {
      const nonMinaTxn = { family: "bitcoin" } as unknown as Transaction;
      expect(() =>
        inferTransactions(
          [
            {
              account: {} as DeepPartial<Account> as Account,
              transaction: nonMinaTxn as Transaction,
            },
          ],
          {},
        ),
      ).toThrow();
    });
  });
});
