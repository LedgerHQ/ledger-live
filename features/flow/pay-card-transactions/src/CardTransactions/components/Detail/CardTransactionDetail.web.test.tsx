import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { CardTransactionDetail } from "./CardTransactionDetail";
import { CATEGORY_LABELS, DETAIL_COPY, cardApiWrapper } from "../../../__tests__/cardApiStore";

const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);

describe("CardTransactionDetail (web)", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("shows the selected transaction details in a dialog", () => {
    render(<CardTransactionDetail isOpen transaction={transaction} onClose={jest.fn()} />, {
      wrapper: cardApiWrapper(),
    });

    expect(screen.getByTestId("card-transaction-detail-dialog")).toBeVisible();
    expect(screen.getByText("NETFLIX.COM")).toBeVisible();
    expect(screen.getByText(CATEGORY_LABELS.SUBSCRIPTIONS)).toBeVisible();
    expect(screen.getByText(DETAIL_COPY.amount)).toBeVisible();
    expect(screen.getByText("-12.99 EUR")).toBeVisible();
    expect(screen.getByText(DETAIL_COPY.statusValues.CONFIRMED)).toBeVisible();
    expect(screen.getByText("***9189")).toBeVisible();
    expect(screen.getByText("-13.0214 USDC")).toBeVisible();
    expect(screen.getByText(transaction.transactionId ?? "")).toBeVisible();
  });

  it("copies the processor transaction id", async () => {
    render(<CardTransactionDetail isOpen transaction={transaction} onClose={jest.fn()} />, {
      wrapper: cardApiWrapper(),
    });

    fireEvent.click(screen.getByTestId("card-transaction-detail-copy"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(transaction.transactionId);
    });
  });

  it("reports a header close", () => {
    const onClose = jest.fn();
    render(<CardTransactionDetail isOpen transaction={transaction} onClose={onClose} />, {
      wrapper: cardApiWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
