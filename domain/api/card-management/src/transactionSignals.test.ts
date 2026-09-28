import { documentedPayCardTransaction } from "./cardTransactions.mock";
import { PayCardTransactionSchema } from "./schema";
import { hasCardTransactions } from "./transactionSignals";

const documented = PayCardTransactionSchema.parse(documentedPayCardTransaction);

describe("hasCardTransactions", () => {
  it("is false before any page has been read", () => {
    expect(hasCardTransactions(undefined)).toBe(false);
  });

  it("is false when the first page came back empty", () => {
    expect(hasCardTransactions([[]])).toBe(false);
  });

  it("is true as soon as the first page holds a transaction", () => {
    expect(hasCardTransactions([[documented]])).toBe(true);
  });

  it("reads the first page only, since a later one exists only once it came back full", () => {
    expect(hasCardTransactions([[documented], [documented, documented]])).toBe(true);
  });
});
