import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { useCardTransactionsViewModel } from "../hooks/useCardTransactionsViewModel";
import { listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_TRANSACTIONS_URL, CATEGORY_LABELS, cardApiWrapper } from "./cardApiStore";

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
    expect(aliExpress?.category).toBe("MISC");
    expect(aliExpress?.categoryLabel).toBe(CATEGORY_LABELS.MISC);

    for (const { category, categoryLabel } of result.current.transactions) {
      expect(categoryLabel).toBe(CATEGORY_LABELS[category]);
    }
  });

  it("still lists a transaction the provider put in a category it never documented", async () => {
    const [first] = mockPayCardTransactions();
    answerWith([{ ...first, mccCategory: "SHOPPING" }]);

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.transactions).toHaveLength(1));
    expect(result.current.transactions[0]?.category).toBe("MISC");
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
});
