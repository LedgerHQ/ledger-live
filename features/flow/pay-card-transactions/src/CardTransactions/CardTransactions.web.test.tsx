import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_TRANSACTIONS_URL, SECTION_TITLE, cardApiWrapper } from "../__tests__/cardApiStore";
import { CardTransactions } from "./CardTransactions";

const server = listenToCardApi();

describe("CardTransactions", () => {
  it("renders nothing while the first page is loading", async () => {
    let send!: (body: JsonBodyType) => void;
    const pending = new Promise<JsonBodyType>(resolve => {
      send = resolve;
    });

    server.use(http.get(CARD_TRANSACTIONS_URL, async () => HttpResponse.json(await pending)));

    render(<CardTransactions />, { wrapper: cardApiWrapper({ signedIn: true }) });

    expect(screen.queryByTestId("card-transactions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-transactions-list")).not.toBeInTheDocument();

    send(mockPayCardTransactions());
    await waitFor(() => expect(screen.getByTestId("card-transactions-list")).toBeVisible());
  });

  it("renders nothing when there are no transactions", async () => {
    let answered = false;
    server.use(
      http.get(CARD_TRANSACTIONS_URL, () => {
        answered = true;
        return HttpResponse.json([]);
      }),
    );

    render(<CardTransactions />, { wrapper: cardApiWrapper({ signedIn: true }) });

    await waitFor(() => expect(answered).toBe(true));
    expect(screen.queryByTestId("card-transactions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-transactions-subheader")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-transactions-list")).not.toBeInTheDocument();
  });

  it("shows the list once transactions arrive", async () => {
    const page = mockPayCardTransactions();
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(page)));

    render(<CardTransactions />, { wrapper: cardApiWrapper({ signedIn: true }) });

    await waitFor(() => expect(screen.getByTestId("card-transactions-list")).toBeVisible());
    expect(screen.getByTestId("card-transactions-subheader")).toBeVisible();
    expect(screen.getByText(SECTION_TITLE)).toBeVisible();
    expect(screen.getByText("NETFLIX.COM")).toBeVisible();
  });
});
