import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { ListItem } from "./ListItem";
import { CATEGORY_LABELS, cardApiWrapper } from "../../../__tests__/cardApiStore";
import type { CardTransactionItem } from "../../../types";

const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);

function item(overrides: Partial<CardTransactionItem["transaction"]> = {}): CardTransactionItem {
  const next = { ...transaction, ...overrides };

  return {
    transaction: next,
    categoryLabel: CATEGORY_LABELS[next.mccCategory],
  };
}

describe("ListItem", () => {
  it("shows the merchant name, date, category icon, fiat amount and funding asset amount", () => {
    render(
      <ListItem item={item()} formatters={{ date: date => date.toISOString().slice(0, 10) }} />,
      {
        wrapper: cardApiWrapper(),
      },
    );

    expect(screen.getByTestId(`card-transactions-item-${transaction.id}`)).toBeVisible();
    expect(screen.getByText("NETFLIX.COM")).toBeVisible();
    expect(screen.queryByText(transaction.merchantNameLocation)).not.toBeInTheDocument();
    expect(screen.getByText(CATEGORY_LABELS[transaction.mccCategory])).toBeVisible();
    expect(screen.getByText("-12.99 EUR")).toBeVisible();
    expect(screen.getByText("-13.0214 USDC")).toBeVisible();
    expect(screen.getByText("2024-10-14")).toBeVisible();
  });

  it("uses the host amount formatter for fiat and funding asset values", () => {
    const formatAmount = jest.fn((value: string, currency: string) => `${currency}:${value}`);

    render(<ListItem item={item()} formatters={{ amount: formatAmount }} />, {
      wrapper: cardApiWrapper(),
    });

    expect(screen.getByText("EUR:-12.99")).toBeVisible();
    expect(screen.getByText("usdc:-13.0214")).toBeVisible();
    expect(formatAmount).toHaveBeenNthCalledWith(1, "-12.99", "EUR", "fiat");
    expect(formatAmount).toHaveBeenNthCalledWith(2, "-13.0214", "usdc", "crypto");
  });

  it("does not show the transaction status", () => {
    render(<ListItem item={item({ status: "DECLINED" })} />, { wrapper: cardApiWrapper() });

    expect(screen.queryByText("Declined")).not.toBeInTheDocument();
  });

  it("reports a row click", () => {
    const onPress = jest.fn();
    render(<ListItem item={item()} onPress={onPress} />, { wrapper: cardApiWrapper() });

    fireEvent.click(screen.getByTestId(`card-transactions-item-${transaction.id}`));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
