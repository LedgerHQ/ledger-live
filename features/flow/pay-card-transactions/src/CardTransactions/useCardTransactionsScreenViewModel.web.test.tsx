import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_TRANSACTIONS_URL, cardApiWrapper } from "../__tests__/cardApiStore";
import { useCardTransactionsScreenViewModel } from "./useCardTransactionsScreenViewModel";

const server = listenToCardApi();

describe("useCardTransactionsScreenViewModel", () => {
  it("stays on loading until the page arrives", async () => {
    let send!: (body: JsonBodyType) => void;
    const pending = new Promise<JsonBodyType>(resolve => {
      send = resolve;
    });

    server.use(
      http.get(CARD_TRANSACTIONS_URL, async () => {
        const body = await pending;
        return HttpResponse.json(body);
      }),
    );

    const { result } = renderHook(() => useCardTransactionsScreenViewModel(), {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    expect(result.current.displayMode).toBe("loading");

    send(mockPayCardTransactions());

    await waitFor(() => expect(result.current.displayMode).toBe("list"));
  });

  it("uses empty when the provider answers with no transactions", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json([])));

    const { result } = renderHook(() => useCardTransactionsScreenViewModel(), {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    await waitFor(() => expect(result.current.displayMode).toBe("empty"));
    expect(result.current.transactions).toEqual([]);
  });

  it("distinguishes a failed request from an empty history", async () => {
    server.use(
      http.get(CARD_TRANSACTIONS_URL, () =>
        HttpResponse.json({ message: "Unavailable" }, { status: 503 }),
      ),
    );

    const { result } = renderHook(() => useCardTransactionsScreenViewModel(), {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    await waitFor(() => expect(result.current.displayMode).toBe("error"));
  });

  it("uses list when the provider answers with transactions", async () => {
    const page = mockPayCardTransactions();
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(page)));

    const { result } = renderHook(() => useCardTransactionsScreenViewModel(), {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    await waitFor(() => expect(result.current.displayMode).toBe("list"));
    expect(result.current.title).toBe("Transactions");
    expect(result.current.transactions).toHaveLength(page.length);
  });
});
