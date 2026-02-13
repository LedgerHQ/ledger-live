import { Account } from "@ledgerhq/types-live";
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
      const account = { currency: { family: "mina" } } as unknown as Account;
      const result = inferAccounts(account);
      expect(result).toEqual([account]);
    });

    it("should throw for non-mina family", () => {
      const account = { currency: { family: "bitcoin" } } as unknown as Account;
      expect(() => inferAccounts(account)).toThrow();
    });
  });

  describe("inferTransactions", () => {
    const baseTxn = { family: "mina", amount: "1000" };

    it("should set memo from opts", () => {
      const result = inferTransactions(
        [{ account: {} as any, transaction: baseTxn as any }],
        { memo: "hello" },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({ family: "mina", memo: "hello" }),
      );
    });

    it("should create delegation transaction when delegateAddress is provided", () => {
      const result = inferTransactions(
        [{ account: {} as any, transaction: baseTxn as any }],
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
      expect(() =>
        inferTransactions(
          [{ account: {} as any, transaction: { family: "bitcoin" } as any }],
          {},
        ),
      ).toThrow();
    });
  });
});
