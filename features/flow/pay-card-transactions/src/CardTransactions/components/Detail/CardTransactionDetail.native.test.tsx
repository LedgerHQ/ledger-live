import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { CardTransactionDetail } from "./CardTransactionDetail";
import { CATEGORY_LABELS, DETAIL_COPY, cardApiWrapper } from "../../../__tests__/cardApiStore";

const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);

describe("CardTransactionDetail (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the merchant, status, last four digits, funding source and transaction id", () => {
    render(<CardTransactionDetail transaction={transaction} />, { wrapper: cardApiWrapper() });

    expect(screen.getByTestId("card-transaction-detail")).toBeVisible();
    expect(screen.getByText("NETFLIX.COM")).toBeVisible();
    expect(screen.getByLabelText(CATEGORY_LABELS.SUBSCRIPTIONS)).toBeVisible();
    expect(screen.getByText(DETAIL_COPY.amount)).toBeVisible();
    expect(screen.getByText("-12.99 EUR")).toBeVisible();
    expect(screen.getByText(DETAIL_COPY.statusValues.CONFIRMED)).toBeVisible();
    expect(screen.getByText("***9189")).toBeVisible();
    expect(screen.getByLabelText(DETAIL_COPY.cardInfo)).toBeVisible();
    expect(screen.getByText("-13.0214 USDC")).toBeVisible();
    expect(screen.getByText(transaction.transactionId ?? "")).toBeVisible();
    expect(screen.queryByText("Cashback")).toBeNull();
  });

  it("copies the processor transaction id", async () => {
    const user = userEvent.setup();

    render(<CardTransactionDetail transaction={transaction} />, {
      wrapper: cardApiWrapper(),
    });

    await user.press(screen.getByTestId("card-transaction-detail-copy"));

    expect(Clipboard.setString).toHaveBeenCalledWith(transaction.transactionId);
  });
});
