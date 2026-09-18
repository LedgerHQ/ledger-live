import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_TRANSACTIONS_URL, cardApiWrapper } from "../__tests__/cardApiStore";
import { CardTransactionHistory } from "./CardTransactionHistory.web";
import { isCardTransactionFundedBy } from "../logic/isCardTransactionFundedBy";

const server = listenToCardApi();

describe("CardTransactionHistory", () => {
  it("should use the host date formatter for day headers", async () => {
    const formatDay = jest.fn(() => "Formatted day");
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    render(<CardTransactionHistory formatters={{ date: formatDay }} />, {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    expect(await screen.findByText("Formatted day")).toBeVisible();
    expect(formatDay).toHaveBeenCalled();
  });

  it("should not open transaction details when the funding tooltip is clicked", async () => {
    const user = userEvent.setup();
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    render(<CardTransactionHistory />, {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    await user.click(await screen.findByRole("button", { name: "Funding sources" }));

    expect(screen.queryByTestId("card-transaction-detail-dialog")).not.toBeInTheDocument();
  });

  it("should show cashback between the transaction and funding columns", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    render(<CardTransactionHistory />, { wrapper: cardApiWrapper({ signedIn: true }) });

    expect(await screen.findByText("STARBUCKS")).toBeVisible();
    const transaction = screen.getByTestId("card-history-column-transaction");
    const cashback = screen.getByTestId("card-history-column-cashback");
    const funding = screen.getByTestId("card-history-column-funding");
    const amount = screen.getByTestId("card-history-column-amount");
    expect(transaction.nextElementSibling).toBe(cashback);
    expect(cashback.nextElementSibling).toBe(funding);
    expect(funding.nextElementSibling).toBe(amount);
  });

  it("should keep the same columns when history is filtered by asset", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    render(
      <CardTransactionHistory
        filterTransaction={item => isCardTransactionFundedBy(item, "btc", "bitcoin")}
      />,
      { wrapper: cardApiWrapper({ signedIn: true }) },
    );

    expect(await screen.findByText("STARBUCKS")).toBeVisible();
    expect(screen.queryByText("NETFLIX.COM")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-history-column-cashback")).toBeVisible();
    expect(screen.getByText("-0.00005231 BTC")).toBeVisible();
    expect(screen.getByText("-4.75 EUR")).toBeVisible();
  });
});
