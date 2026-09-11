import { PAY_CARD_TRANSACTION_CATEGORIES, PayCardTransactionsResponseSchema } from "./schema";
import { mockPayCardTransactions } from "./cardTransactions.mock";

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

  it("keeps the provider's documented charge as the miscellaneous one", () => {
    const misc = mockPayCardTransactions().find(({ mccCategory }) => mccCategory === "MISC");

    expect(misc?.merchantNameLocation).toBe("WWW.ALIEXPRESS.COM, LONDON");
  });
});
