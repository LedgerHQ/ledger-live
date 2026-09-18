import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_TRANSACTIONS_URL, cardApiWrapper } from "../__tests__/cardApiStore";
import { CardTransactionHistory } from "./CardTransactionHistory.web";
import { isCardTransactionFundedBy } from "../logic/isCardTransactionFundedBy";

const server = listenToCardApi();

describe("CardTransactionHistory", () => {
  it("uses the host date formatter for day headers", async () => {
    const formatDay = jest.fn(() => "Formatted day");
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    render(<CardTransactionHistory formatters={{ date: formatDay }} />, {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    expect(await screen.findByText("Formatted day")).toBeVisible();
    expect(formatDay).toHaveBeenCalled();
  });

  it("does not open transaction details when the funding tooltip is clicked", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    render(<CardTransactionHistory />, {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    fireEvent.click(await screen.findByRole("button", { name: "Funding sources" }));

    expect(screen.queryByTestId("card-transaction-detail-dialog")).not.toBeInTheDocument();
  });

  it("shows only one asset with value and amount columns", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    render(
      <CardTransactionHistory
        filterTransaction={item => isCardTransactionFundedBy(item, "btc", "bitcoin")}
        assetCode="btc"
        columnSet="asset"
      />,
      { wrapper: cardApiWrapper({ signedIn: true }) },
    );

    expect(await screen.findByText("STARBUCKS")).toBeVisible();
    expect(screen.queryByText("NETFLIX.COM")).not.toBeInTheDocument();
    const transaction = screen.getByTestId("card-history-column-transaction");
    const value = screen.getByTestId("card-history-column-value");
    const amount = screen.getByTestId("card-history-column-amount");
    expect(transaction.nextElementSibling).toBe(value);
    expect(value.nextElementSibling).toBe(amount);
  });
});
