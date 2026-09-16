import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("shows only the preview and calls onShowMore from the subheader", async () => {
    const page = mockPayCardTransactions();
    const onShowMore = jest.fn();
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(page)));

    render(<CardTransactions onShowMore={onShowMore} />, {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    await waitFor(() => expect(screen.getByTestId("card-transactions-list")).toBeVisible());
    expect(screen.getAllByTestId(/^card-transactions-item-/)).toHaveLength(3);

    fireEvent.click(screen.getByTestId("card-transactions-subheader"));

    expect(onShowMore).toHaveBeenCalledTimes(1);
  });

  it("opens a transaction dialog from a row and tracks the click", async () => {
    const page = mockPayCardTransactions();
    const onTrackEvent = jest.fn();
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(page)));

    render(<CardTransactions onTrackEvent={onTrackEvent} />, {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    fireEvent.click(await screen.findByText("NETFLIX.COM"));

    expect(screen.getByTestId("card-transaction-detail-dialog")).toBeVisible();
    expect(onTrackEvent).toHaveBeenCalledWith("transaction_clicked", {
      category: "card",
      transaction: "out",
      page: "Pay",
      cardFundSourceAsset: "USDC",
    });
  });

  it("closes the selected transaction dialog", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));
    render(<CardTransactions />, { wrapper: cardApiWrapper({ signedIn: true }) });

    fireEvent.click(await screen.findByText("NETFLIX.COM"));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByTestId("card-transaction-detail-dialog")).not.toBeInTheDocument();
  });
});
