import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_TRANSACTIONS_URL, cardApiWrapper } from "../__tests__/cardApiStore";
import { CardTransactionHistory } from "./CardTransactionHistory.web";

const server = listenToCardApi();

describe("CardTransactionHistory", () => {
  it("does not open transaction details when the funding tooltip is clicked", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    render(<CardTransactionHistory />, {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    fireEvent.click(await screen.findByRole("button", { name: "Funding sources" }));

    expect(screen.queryByTestId("card-transaction-detail-dialog")).not.toBeInTheDocument();
  });
});
