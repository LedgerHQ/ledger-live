import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import {
  formatCardTransactionDate,
  formatFundingSources,
  formatMaskedPanLast4,
  formatMerchantName,
  formatSignedAmount,
  formatTransactionDetailDateTime,
} from "./formatCardTransactionItem";

const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);

const TIMESTAMP = "2024-10-14T10:44:36.276Z";

function formatLocale(locale: string) {
  return (date: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

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

  it("uses the host date formatter", () => {
    expect(formatCardTransactionDate(TIMESTAMP, formatLocale("en-US"))).toBe("Oct 14, 2024");
    expect(formatCardTransactionDate(TIMESTAMP, formatLocale("en-GB"))).toBe("14 Oct 2024");
    expect(formatCardTransactionDate(TIMESTAMP, () => "14/10/2024")).toBe("14/10/2024");
  });

  it("keeps an unparseable timestamp as it was sent", () => {
    expect(formatCardTransactionDate("not-a-date", formatLocale("en-US"))).toBe("not-a-date");
  });

  it("masks the last four PAN digits", () => {
    expect(formatMaskedPanLast4("3328")).toBe("***3328");
  });

  it("labels a same-day timestamp as today plus the time of day", () => {
    const now = new Date(2024, 9, 14, 15, 0, 0);
    const dateTime = new Date(2024, 9, 14, 12, 32, 0).toISOString();
    const translate = jest.fn(
      (key: "today" | "yesterday" | "dateTime", options: { time: string }) =>
        `${key}:${options.time}`,
    );

    formatTransactionDetailDateTime(dateTime, translate, undefined, now);

    expect(translate).toHaveBeenCalledWith("today", { time: expect.any(String) });
  });

  it("labels the previous calendar day as yesterday plus the time of day", () => {
    const now = new Date(2024, 9, 15, 9, 0, 0);
    const dateTime = new Date(2024, 9, 14, 12, 32, 0).toISOString();
    const translate = jest.fn(
      (key: "today" | "yesterday" | "dateTime", options: { time: string }) =>
        `${key}:${options.time}`,
    );

    formatTransactionDetailDateTime(dateTime, translate, undefined, now);

    expect(translate).toHaveBeenCalledWith("yesterday", { time: expect.any(String) });
  });
});
