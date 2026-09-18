import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_TRANSACTIONS_URL, cardApiWrapper } from "../__tests__/cardApiStore";
import { useCardTransactionHistoryViewModel } from "./useCardTransactionHistoryViewModel";

const server = listenToCardApi();

const onRowClick = () => {};

describe("useCardTransactionHistoryViewModel", () => {
  it("should tell a holder with no session apart from one who has not spent yet", () => {
    const { result } = renderHook(() => useCardTransactionHistoryViewModel({ onRowClick }), {
      wrapper: cardApiWrapper({ signedIn: false }),
    });

    expect(result.current.displayState.kind).toBe("signedOut");
  });

  it("should use empty when the signed-in holder has no transactions", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json([])));

    const { result } = renderHook(() => useCardTransactionHistoryViewModel({ onRowClick }), {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    await waitFor(() => expect(result.current.displayState.kind).toBe("empty"));
  });

  it("should expose every transaction when the list is ready", async () => {
    const page = mockPayCardTransactions();
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(page)));

    const { result } = renderHook(() => useCardTransactionHistoryViewModel({ onRowClick }), {
      wrapper: cardApiWrapper({ signedIn: true }),
    });

    await waitFor(() => expect(result.current.displayState.kind).toBe("ready"));

    const displayState = result.current.displayState;
    if (displayState.kind !== "ready") {
      throw new Error("expected ready displayState");
    }

    expect(displayState.groups.flatMap(({ items }) => items)).toHaveLength(page.length);
  });

  it("should only expose the transactions the scoped asset funded", async () => {
    const page = mockPayCardTransactions();
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(page)));

    const { result } = renderHook(
      () => useCardTransactionHistoryViewModel({ onRowClick, asset: "bitcoin" }),
      { wrapper: cardApiWrapper({ signedIn: true }) },
    );

    await waitFor(() => expect(result.current.displayState.kind).toBe("ready"));
    const displayState = result.current.displayState;
    if (displayState.kind !== "ready") throw new Error("expected ready displayState");

    const items = displayState.groups.flatMap(({ items }) => items);
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThan(page.length);
    for (const item of items) {
      expect(item.transaction.fundingSources?.map(source => source.currency)).toContain("btc");
    }
  });

  it("should expose nothing when the scoped asset is not one the catalog covers", async () => {
    server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));

    const { result } = renderHook(
      () => useCardTransactionHistoryViewModel({ onRowClick, asset: "nowhere/erc20/nope" }),
      { wrapper: cardApiWrapper({ signedIn: true }) },
    );

    await waitFor(() => expect(result.current.displayState.kind).toBe("empty"));
  });
});
