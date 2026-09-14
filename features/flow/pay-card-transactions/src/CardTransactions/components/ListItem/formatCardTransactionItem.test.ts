import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import {
  formatCardTransactionDate,
  formatFundingSources,
  formatMerchantName,
  formatSignedAmount,
} from "./formatCardTransactionItem";

const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);

describe("formatCardTransactionItem", () => {
  it("prefixes a debit with a minus and a credit with a plus", () => {
    expect(formatSignedAmount(transaction)).toBe("-12.99 EUR");
    expect(formatSignedAmount({ ...transaction, sign: "CREDIT" })).toBe("+12.99 EUR");
  });

  it("formats every funding source used for the payment", () => {
    expect(formatFundingSources(transaction.fundingSources)).toBe("-13.0214 USDC");
    expect(formatFundingSources([])).toBeUndefined();
  });

  it("removes the location suffix from the merchant name", () => {
    expect(formatMerchantName("NETFLIX.COM, LOS GATOS")).toBe("NETFLIX.COM");
    expect(formatMerchantName("SMITH, JONES & CO, PARIS")).toBe("SMITH, JONES & CO");
    expect(formatMerchantName("LEDGER")).toBe("LEDGER");
  });

  it("formats the provider timestamp as a medium date", () => {
    expect(formatCardTransactionDate("2024-10-14T10:44:36.276Z", "en-US")).toBe("Oct 14, 2024");
  });

  it("formats the timestamp in the locale it was given", () => {
    const inEnglish = formatCardTransactionDate("2024-10-14T10:44:36.276Z", "en-US");

    expect(formatCardTransactionDate("2024-10-14T10:44:36.276Z", "fr-FR")).not.toBe(inEnglish);
  });

  it("keeps an unparseable timestamp as it was sent", () => {
    expect(formatCardTransactionDate("not-a-date", "en-US")).toBe("not-a-date");
  });
});
