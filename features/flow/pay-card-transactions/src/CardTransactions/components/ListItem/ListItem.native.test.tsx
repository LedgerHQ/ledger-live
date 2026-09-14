import React from "react";
import { render, screen } from "@testing-library/react-native";
import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { ListItem } from "./ListItem";
import { CATEGORY_LABELS, cardApiWrapper } from "../../../__tests__/cardApiStore";
import type { CardTransactionItem } from "../../../types";

const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);

function item(): CardTransactionItem {
  return {
    transaction,
    categoryLabel: CATEGORY_LABELS[transaction.mccCategory],
  };
}

describe("ListItem (native)", () => {
  it("shows the merchant, date, category, fiat amount and funding asset amount", () => {
    render(<ListItem item={item()} />, { wrapper: cardApiWrapper() });

    expect(screen.getByTestId(`card-transactions-item-${transaction.id}`)).toBeVisible();
    expect(screen.getByText("NETFLIX.COM")).toBeVisible();
    expect(screen.getByLabelText(CATEGORY_LABELS[transaction.mccCategory])).toBeVisible();
    expect(screen.getByText("-12.99 EUR")).toBeVisible();
    expect(screen.getByText("-13.0214 USDC")).toBeVisible();
    expect(screen.getByText("Oct 14, 2024")).toBeVisible();
  });

  it("uses the host amount formatter", () => {
    const formatAmount = jest.fn((value: string, currency: string) => `${currency}:${value}`);

    render(<ListItem item={item()} formatAmount={formatAmount} />, {
      wrapper: cardApiWrapper(),
    });

    expect(screen.getByText("EUR:-12.99")).toBeVisible();
    expect(screen.getByText("usdc:-13.0214")).toBeVisible();
    expect(formatAmount).toHaveBeenNthCalledWith(1, "-12.99", "EUR", "fiat");
    expect(formatAmount).toHaveBeenNthCalledWith(2, "-13.0214", "usdc", "crypto");
  });
});
