import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_TRANSACTIONS_URL, SECTION_TITLE, cardApiWrapper } from "../__tests__/cardApiStore";
import { CardTransactions } from "./CardTransactions";

const server = listenToCardApi();

describe("CardTransactions (native)", () => {
  it("renders nothing while transactions are loading", async () => {
    let send!: (body: JsonBodyType) => void;
    const pending = new Promise<JsonBodyType>(resolve => {
      send = resolve;
    });

    server.use(http.get(CARD_TRANSACTIONS_URL, async () => HttpResponse.json(await pending)));

    render(<CardTransactions />, { wrapper: cardApiWrapper({ signedIn: true }) });

    expect(screen.queryByTestId("card-transactions")).toBeNull();

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
    expect(screen.queryByTestId("card-transactions")).toBeNull();
  });

  it("renders the list when transactions arrive", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    render(<CardTransactions />, { wrapper: cardApiWrapper({ signedIn: true }) });

    await waitFor(() => expect(screen.getByTestId("card-transactions-list")).toBeVisible());
    expect(screen.getByText(SECTION_TITLE)).toBeVisible();
    expect(screen.getByText("NETFLIX.COM")).toBeVisible();
  });
});
