import {
  PAY_CARD_TRANSACTION_CATEGORIES,
  PayCardTransactionsResponseSchema,
} from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { categoryOf, transactionHasCategory } from "./categoryOf";

const transactions = PayCardTransactionsResponseSchema.parse(mockPayCardTransactions());

const [aliExpress] = transactions.filter(
  ({ merchantNameLocation }) => merchantNameLocation === "WWW.ALIEXPRESS.COM, LONDON",
);

describe("categoryOf", () => {
  it("reads the documented AliExpress charge as a miscellaneous purchase", () => {
    expect(categoryOf(aliExpress)).toBe("MISC");
  });

  it.each(PAY_CARD_TRANSACTION_CATEGORIES)(
    "reads a transaction the provider classified as %s",
    category => {
      expect(categoryOf({ ...aliExpress, mccCategory: category })).toBe(category);
    },
  );
});

describe("transactionHasCategory", () => {
  it("answers whether a transaction falls in a given category", () => {
    expect(transactionHasCategory(aliExpress, "MISC")).toBe(true);
    expect(transactionHasCategory(aliExpress, "FOOD")).toBe(false);
  });
});
