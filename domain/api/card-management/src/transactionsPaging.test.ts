import { documentedPayCardTransaction } from "./cardTransactions.mock";
import { PayCardTransactionSchema } from "./schema";
import {
  FIRST_CARD_TRANSACTIONS_PAGE,
  joinCardTransactionsPages,
  nextCardTransactionsPage,
} from "./transactionsPaging";

const documented = PayCardTransactionSchema.parse(documentedPayCardTransaction);

function page(...ids: readonly string[]) {
  return ids.map(id => ({ ...documented, id }));
}

/** Dated descending in the order given, so a join can be checked against a known newest-first run. */
function datedPage(...ids: readonly string[]) {
  return ids.map((id, index) => ({
    ...documented,
    id,
    dateTime: new Date(Date.UTC(2026, 0, 31 - index)).toISOString(),
  }));
}

describe("FIRST_CARD_TRANSACTIONS_PAGE", () => {
  it("is zero, the page the provider numbers from", () => {
    expect(FIRST_CARD_TRANSACTIONS_PAGE).toBe(0);
  });
});

describe("nextCardTransactionsPage", () => {
  it("asks for the page after the one just read", () => {
    const first = page("a", "b", "c");
    const second = page("d", "e", "f");

    expect(nextCardTransactionsPage(second, [first, second], 1)).toBe(2);
  });

  it("stops on an empty page", () => {
    const first = page("a", "b", "c");

    expect(nextCardTransactionsPage([], [first, []], 1)).toBeUndefined();
  });

  it("reads on from a short page, since only an empty one ends the list", () => {
    // No page size is documented, so a short page is indistinguishable from a full one. Reading on
    // costs one request, which comes back empty and stops it.
    const first = page("a", "b", "c");
    const second = page("d", "e");

    expect(nextCardTransactionsPage(second, [first, second], 1)).toBe(2);
  });

  it("counts from the page param it was given, not from how many pages are held", () => {
    const held = page("a", "b");

    expect(nextCardTransactionsPage(held, [held], 7)).toBe(8);
  });
});

describe("joinCardTransactionsPages", () => {
  it("has nothing to join before the first page arrives", () => {
    expect(joinCardTransactionsPages(undefined)).toEqual([]);
  });

  it("joins the pages newest first", () => {
    const [a, b, c, d] = datedPage("a", "b", "c", "d");
    const ids = joinCardTransactionsPages([
      [a, b],
      [c, d],
    ]).map(({ id }) => id);

    expect(ids).toEqual(["a", "b", "c", "d"]);
  });

  it("puts a transaction that landed mid-read back where its date belongs", () => {
    // A purchase between the two reads shifts the provider's paging, so the second page can carry
    // something newer than anything on the first. Left where it was read it would show up as the
    // oldest charge in the list.
    const [newest, a, b] = datedPage("newest", "a", "b");

    const ids = joinCardTransactionsPages([[a, b], [newest]]).map(({ id }) => id);

    expect(ids).toEqual(["newest", "a", "b"]);
  });

  it("drops a transaction that arrived on two pages, keeping its first reading", () => {
    const ids = joinCardTransactionsPages([page("a", "b"), page("a", "b")]).map(({ id }) => id);

    expect(ids).toEqual(["a", "b"]);
  });

  it("keeps every distinct transaction when a page only partly repeats", () => {
    const ids = joinCardTransactionsPages([page("a", "b"), page("b", "c")]).map(({ id }) => id);

    expect(ids).toEqual(["a", "b", "c"]);
  });
});
