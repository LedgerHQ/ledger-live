import type { PayCardTransaction } from "@domain/api-card-management";
import { isCardTransactionFundedBy } from "./isCardTransactionFundedBy";

function item(fundingSources?: PayCardTransaction["fundingSources"]) {
  return {
    categoryLabel: "Other",
    transaction: {
      id: "tx",
      dateTime: "2026-09-18T12:32:00.000Z",
      sign: "DEBIT",
      merchantNameLocation: "Uniqlo, Paris",
      mccCategory: "MISC",
      status: "CONFIRMED",
      transactionCurrency: "USD",
      amountInTransactionCurrency: "324.43",
      feesInTransactionCurrency: "0",
      originalCurrency: "USD",
      amountInOriginalCurrency: "324.43",
      ...(fundingSources ? { fundingSources } : {}),
    } as PayCardTransaction,
  };
}

const usdc = item([{ currency: "USDC", amount: "324.43", sign: "DEBIT" }]);
const btc = item([{ currency: "btc", amount: "0.004", sign: "DEBIT" }]);

describe("isCardTransactionFundedBy", () => {
  it("should keep the selected asset and drop every other one", () => {
    expect(isCardTransactionFundedBy(usdc, "usdc", "ethereum")).toBe(true);
    expect(isCardTransactionFundedBy(btc, "usdc", "ethereum")).toBe(false);
    expect(isCardTransactionFundedBy(btc, "btc", "bitcoin")).toBe(true);
  });

  it("should list a transaction under each of the assets that funded it", () => {
    const paidWithTwoAssets = item([
      { currency: "usdc", amount: "300", sign: "DEBIT" },
      { currency: "eth", amount: "0.01", sign: "DEBIT" },
    ]);

    expect(isCardTransactionFundedBy(paidWithTwoAssets, "usdc", "ethereum")).toBe(true);
    expect(isCardTransactionFundedBy(paidWithTwoAssets, "eth", "ethereum")).toBe(true);
    expect(isCardTransactionFundedBy(paidWithTwoAssets, "btc", "bitcoin")).toBe(false);
  });

  it("should match nothing for a pair the catalog does not cover", () => {
    expect(isCardTransactionFundedBy(usdc, "usdc")).toBe(true);
    expect(isCardTransactionFundedBy(usdc, "usdc", "polygon")).toBe(false);
    expect(isCardTransactionFundedBy(usdc, "doge")).toBe(false);
  });

  it("should drop a transaction the provider sent no funding sources for", () => {
    expect(isCardTransactionFundedBy(item(), "usdc", "ethereum")).toBe(false);
  });
});
