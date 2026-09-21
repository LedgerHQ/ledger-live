import { PAY_CARD_TRANSACTION_CATEGORIES, PayCardTransactionsResponseSchema } from "./schema";
import { documentedPayCardTransaction, mockPayCardTransactions } from "./cardTransactions.mock";

describe("mockPayCardTransactions", () => {
  it("answers a page the transaction schema accepts", () => {
    expect(PayCardTransactionsResponseSchema.parse(mockPayCardTransactions())).toHaveLength(
      PAY_CARD_TRANSACTION_CATEGORIES.length,
    );
  });

  it("covers every spend category, so each one can be seen in a list", () => {
    const categories = mockPayCardTransactions().map(({ mccCategory }) => mccCategory);

    expect([...categories].sort()).toEqual([...PAY_CARD_TRANSACTION_CATEGORIES].sort());
  });

  it("covers different fiat and funding asset amounts for visual testing", () => {
    const transactions = mockPayCardTransactions();
    const fiatAmounts = new Set(
      transactions.map(({ amountInTransactionCurrency }) => amountInTransactionCurrency),
    );
    const assetCurrencies = new Set(
      transactions.flatMap(({ fundingSources }) =>
        fundingSources.map(({ currency }) => currency.toUpperCase()),
      ),
    );

    expect(fiatAmounts.size).toBeGreaterThan(1);
    expect(assetCurrencies).toEqual(new Set(["USDC", "BTC", "ETH"]));
    expect(transactions.some(({ fundingSources }) => fundingSources.length > 1)).toBe(true);
  });

  it("covers every status, so each one can be seen in a list", () => {
    const statuses = mockPayCardTransactions().map(({ status }) => status);

    expect(new Set(statuses)).toEqual(new Set(["CONFIRMED", "PENDING", "DECLINED", "REVERTED"]));
  });

  it("explains why the declined one was declined", () => {
    const declined = mockPayCardTransactions().filter(({ status }) => status === "DECLINED");

    expect(declined).toHaveLength(1);
    expect(declined[0].declineReason).not.toBe("");
  });

  it("pairs every settled charge with the cashback it earned", () => {
    const settled = mockPayCardTransactions().filter(
      ({ status }) => status !== "DECLINED" && status !== "REVERTED",
    );

    expect(settled.length).toBeGreaterThan(1);
    for (const { cashback } of settled) {
      expect(cashback).toMatchObject({ currency: "BXX", status: "EARNED" });
      expect(Number(cashback?.amount)).toBeGreaterThan(0);
      expect(Number(cashback?.fiatAmount)).toBeGreaterThan(0);
    }
  });

  it("leaves a charge that never settled without a cashback", () => {
    const unearned = mockPayCardTransactions().filter(
      ({ status }) => status === "DECLINED" || status === "REVERTED",
    );

    expect(unearned).toHaveLength(2);
    expect(unearned.every(({ cashback }) => cashback === undefined)).toBe(true);
  });

  it("keeps the provider's documented charge as the miscellaneous one", () => {
    const misc = mockPayCardTransactions().find(({ mccCategory }) => mccCategory === "MISC");

    expect(misc).toEqual(documentedPayCardTransaction);
  });
});
