import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { List } from "./List";
import { CATEGORY_LABELS, cardApiWrapper } from "../../../__tests__/cardApiStore";
import type { CardTransactionItem } from "../../../types";

function itemsFromMock(): CardTransactionItem[] {
  return mockPayCardTransactions().map(raw => {
    const transaction = PayCardTransactionSchema.parse(raw);

    return {
      transaction,
      categoryLabel: CATEGORY_LABELS[transaction.mccCategory],
    };
  });
}

describe("List", () => {
  it("renders one item per transaction", () => {
    const transactions = itemsFromMock();

    render(<List transactions={transactions} />, { wrapper: cardApiWrapper() });

    expect(screen.getByTestId("card-transactions-list")).toBeVisible();
    expect(
      screen.getByTestId(`card-transactions-item-${transactions[0]?.transaction.id}`),
    ).toBeVisible();
    expect(
      screen.getByTestId(
        `card-transactions-item-${transactions[transactions.length - 1]?.transaction.id}`,
      ),
    ).toBeVisible();
  });

  it("reports the selected transaction", () => {
    const transactions = itemsFromMock();
    const onTransactionPress = jest.fn();

    render(<List transactions={transactions} onTransactionPress={onTransactionPress} />, {
      wrapper: cardApiWrapper(),
    });

    fireEvent.click(
      screen.getByTestId(`card-transactions-item-${transactions[0]?.transaction.id}`),
    );

    expect(onTransactionPress).toHaveBeenCalledWith(transactions[0]);
  });
});
