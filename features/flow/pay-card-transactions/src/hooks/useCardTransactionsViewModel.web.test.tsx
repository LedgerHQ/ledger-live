import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, type JsonBodyType } from "msw";
import {
  documentedPayCardTransaction,
  mockPayCardTransactions,
} from "@domain/api-card-management/mock/card-transactions";
import { useCardTransactionsViewModel } from "./useCardTransactionsViewModel";
import { listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_TRANSACTIONS_URL, CATEGORY_LABELS, cardApiWrapper } from "../__tests__/cardApiStore";

const server = listenToCardApi();

function answerWith(body: JsonBodyType, status = 200) {
  const requests: URL[] = [];

  server.use(
    http.get(CARD_TRANSACTIONS_URL, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(body, { status });
    }),
  );

  return requests;
}

function transactionsPage(ids: readonly string[]) {
  return ids.map(id => ({ ...documentedPayCardTransaction, id }));
}

/** Answers each page by number, and a page past the end with an empty array, as the provider does. */
function answerPages(pages: readonly (readonly string[])[]) {
  const requested: number[] = [];

  server.use(
    http.get(CARD_TRANSACTIONS_URL, ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get("page"));
      requested.push(page);

      return HttpResponse.json(transactionsPage(pages[page] ?? []));
    }),
  );

  return requested;
}

function renderViewModel({ signedIn = true }: { signedIn?: boolean } = {}) {
  return renderHook(() => useCardTransactionsViewModel(), {
    wrapper: cardApiWrapper({ signedIn }),
  });
}

describe("useCardTransactionsViewModel", () => {
  it("reads the page the provider answers, and keeps the order it sent", async () => {
    const page = mockPayCardTransactions();
    answerWith(page);

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.transactions).toHaveLength(page.length));
    expect(result.current.transactions.map(({ transaction }) => transaction.id)).toEqual(
      page.map(({ id }) => id),
    );
  });

  it("gives every transaction the category the provider classified it in, translated", async () => {
    answerWith(mockPayCardTransactions());

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.transactions.length).toBeGreaterThan(0));

    const aliExpress = result.current.transactions.find(
      ({ transaction }) => transaction.merchantNameLocation === "WWW.ALIEXPRESS.COM, LONDON",
    );
    expect(aliExpress?.transaction.mccCategory).toBe("MISC");
    expect(aliExpress?.categoryLabel).toBe(CATEGORY_LABELS.MISC);

    for (const { transaction, categoryLabel } of result.current.transactions) {
      expect(categoryLabel).toBe(CATEGORY_LABELS[transaction.mccCategory]);
    }
  });

  it("still lists a transaction the provider put in a category it never documented", async () => {
    const [first] = mockPayCardTransactions();
    answerWith([{ ...first, mccCategory: "SHOPPING" }]);

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.transactions).toHaveLength(1));
    expect(result.current.transactions[0]?.transaction.mccCategory).toBe("MISC");
    expect(result.current.transactions[0]?.categoryLabel).toBe(CATEGORY_LABELS.MISC);
  });

  it("reads an empty history as an empty list, not as a failure", async () => {
    answerWith([]);

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.transactions).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("reports a failed read as one, with nothing to list", async () => {
    answerWith({ message: "Internal server error" }, 500);

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.transactions).toEqual([]);
  });

  it("asks for nothing while nobody is signed in, so the provider never answers a 401", async () => {
    const requests = answerWith(mockPayCardTransactions());

    const { result } = renderViewModel({ signedIn: false });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(requests).toEqual([]);
    expect(result.current.transactions).toEqual([]);

    result.current.refetch();

    expect(requests).toEqual([]);
  });

  it("reads the page again on request", async () => {
    const requests = answerWith(mockPayCardTransactions());

    const { result } = renderViewModel();

    await waitFor(() => expect(requests).toHaveLength(1));

    result.current.refetch();

    await waitFor(() => expect(requests).toHaveLength(2));
  });

  describe("reading further pages", () => {
    it("reads the first page only, and offers the next", async () => {
      const requested = answerPages([
        ["a", "b"],
        ["c", "d"],
      ]);

      const { result } = renderViewModel();

      await waitFor(() => expect(result.current.transactions).toHaveLength(2));
      expect(requested).toEqual([0]);
      expect(result.current.loadMore).toBeDefined();
    });

    it("appends the next page to the transactions already read", async () => {
      answerPages([
        ["a", "b"],
        ["c", "d"],
      ]);

      const { result } = renderViewModel();

      await waitFor(() => expect(result.current.transactions).toHaveLength(2));

      act(() => result.current.loadMore?.());

      await waitFor(() => expect(result.current.transactions).toHaveLength(4));
      expect(result.current.transactions.map(({ transaction }) => transaction.id)).toEqual([
        "a",
        "b",
        "c",
        "d",
      ]);
    });

    it("reads past a short page and stops on the empty one after it", async () => {
      // No page size is documented, so a short page could still be a full one. Reading on costs
      // one further request and nothing else: the empty answer adds no rows.
      const requested = answerPages([["a", "b"], ["c"]]);

      const { result } = renderViewModel();

      await waitFor(() => expect(result.current.loadMore).toBeDefined());

      act(() => result.current.loadMore?.());

      await waitFor(() => expect(result.current.transactions).toHaveLength(3));
      expect(result.current.loadMore).toBeDefined();

      act(() => result.current.loadMore?.());

      await waitFor(() => expect(requested).toEqual([0, 1, 2]));
      await waitFor(() => expect(result.current.loadMore).toBeUndefined());
      expect(result.current.transactions).toHaveLength(3);
    });

    it("stops on the empty page the provider answers past the end with", async () => {
      const requested = answerPages([["a", "b"]]);

      const { result } = renderViewModel();

      await waitFor(() => expect(result.current.transactions).toHaveLength(2));

      act(() => result.current.loadMore?.());

      await waitFor(() => expect(requested).toEqual([0, 1]));
      await waitFor(() => expect(result.current.loadMore).toBeUndefined());
      expect(result.current.transactions.map(({ transaction }) => transaction.id)).toEqual([
        "a",
        "b",
      ]);
    });

    it("reads a page once however many times it is asked for in the same tick", async () => {
      const requested = answerPages([
        ["a", "b"],
        ["c", "d"],
      ]);

      const { result } = renderViewModel();

      await waitFor(() => expect(result.current.loadMore).toBeDefined());

      // Both calls see the same render, so this holds through RTK dropping the duplicate fetch
      // rather than through the view model's own in-flight guard.
      act(() => {
        result.current.loadMore?.();
        result.current.loadMore?.();
      });

      await waitFor(() => expect(result.current.transactions).toHaveLength(4));
      expect(requested).toEqual([0, 1]);
    });

    it("offers nothing to read while nobody is signed in", async () => {
      answerPages([
        ["a", "b"],
        ["c", "d"],
      ]);

      const { result } = renderViewModel({ signedIn: false });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.loadMore).toBeUndefined();
    });

    it("stops offering the next page once a read has failed", async () => {
      // A scroll-driven caller re-arms on every identity change of `loadMore`, and a failure
      // produces one. Still offering it there is what turns a failure into a request loop.
      const requested: number[] = [];
      server.use(
        http.get(CARD_TRANSACTIONS_URL, ({ request }) => {
          const page = Number(new URL(request.url).searchParams.get("page"));
          requested.push(page);

          return page === 0
            ? HttpResponse.json(transactionsPage(["a", "b"]))
            : HttpResponse.json({ message: "Unavailable" }, { status: 503 });
        }),
      );

      const { result } = renderViewModel();

      await waitFor(() => expect(result.current.loadMore).toBeDefined());

      act(() => result.current.loadMore?.());

      await waitFor(() => expect(requested).toEqual([0, 1]));
      await waitFor(() => expect(result.current.loadMore).toBeUndefined());
      expect(result.current.transactions).toHaveLength(2);
    });
  });
});
