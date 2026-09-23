import { act, renderHook, waitFor } from "@testing-library/react";
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

  describe("reading further pages", () => {
    function answerPages(pages: readonly (readonly string[])[]) {
      const requested: number[] = [];
      const [documented] = mockPayCardTransactions();

      server.use(
        http.get(CARD_TRANSACTIONS_URL, ({ request }) => {
          const page = Number(new URL(request.url).searchParams.get("page"));
          requested.push(page);

          // A page past the end answers empty, as the provider does.
          return HttpResponse.json((pages[page] ?? []).map(id => ({ ...documented, id })));
        }),
      );

      return requested;
    }

    it("offers a further page while the provider has one", async () => {
      answerPages([
        ["a", "b"],
        ["c", "d"],
      ]);

      const { result } = renderHook(() => useCardTransactionHistoryViewModel({ onRowClick }), {
        wrapper: cardApiWrapper({ signedIn: true }),
      });

      await waitFor(() => expect(result.current.displayState.kind).toBe("ready"));
      expect(result.current.onLoadMore).toBeDefined();
      expect(result.current.isLoadingMore).toBe(false);
    });

    it("groups the next page in with the ones already read", async () => {
      answerPages([
        ["a", "b"],
        ["c", "d"],
      ]);

      const { result } = renderHook(() => useCardTransactionHistoryViewModel({ onRowClick }), {
        wrapper: cardApiWrapper({ signedIn: true }),
      });

      await waitFor(() => expect(result.current.displayState.kind).toBe("ready"));

      act(() => result.current.onLoadMore?.());

      await waitFor(() => {
        const state = result.current.displayState;
        expect(state.kind === "ready" && state.groups.flatMap(({ items }) => items)).toHaveLength(
          4,
        );
      });
    });

    it("stops offering one once an empty page ends the list", async () => {
      // The short second page is read past — no page size is documented — so the empty third one
      // is what ends it.
      const requested = answerPages([["a", "b"], ["c"]]);

      const { result } = renderHook(() => useCardTransactionHistoryViewModel({ onRowClick }), {
        wrapper: cardApiWrapper({ signedIn: true }),
      });

      await waitFor(() => expect(result.current.onLoadMore).toBeDefined());

      act(() => result.current.onLoadMore?.());

      await waitFor(() => expect(requested).toEqual([0, 1]));
      await waitFor(() => expect(result.current.onLoadMore).toBeDefined());

      act(() => result.current.onLoadMore?.());

      await waitFor(() => expect(requested).toEqual([0, 1, 2]));
      await waitFor(() => expect(result.current.onLoadMore).toBeUndefined());
    });
  });
});
