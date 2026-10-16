import { accountsMatching, inOrder, mapPage, pageFrom } from "./query";
import { aStoredAccount } from "./test-utils";

describe("accountsMatching", () => {
  const btc = aStoredAccount({ id: "btc" });
  const eth = aStoredAccount({ id: "eth", network: "ethereum" });
  const polygon = aStoredAccount({ id: "polygon", network: "polygon" });
  const accounts = [btc, eth, polygon];

  it("keeps every account without filter", () => {
    expect(accountsMatching(accounts, {})).toEqual(accounts);
  });

  it("filters by network and by account", () => {
    expect(accountsMatching(accounts, { network: "ethereum" })).toEqual([eth]);
    expect(accountsMatching(accounts, { account: "polygon" })).toEqual([polygon]);
    expect(accountsMatching(accounts, { network: "ethereum", account: "polygon" })).toEqual([]);
  });
});

describe("inOrder", () => {
  const byValue = (a: number, b: number) => a - b;

  it("sorts ascending or descending, leaving the input untouched", () => {
    const items = [2, 3, 1];

    expect(inOrder(items, byValue, "ASC")).toEqual([1, 2, 3]);
    expect(inOrder(items, byValue, "DESC")).toEqual([3, 2, 1]);
    expect(items).toEqual([2, 3, 1]);
  });
});

describe("pageFrom", () => {
  const items = [1, 2, 3, 4, 5];

  it("pages with the default size when the query has none", () => {
    expect(pageFrom(items, {}, 2)).toEqual({ items: [1, 2], nextToken: "2" });
  });

  it("pages from the token, with the query size", () => {
    expect(pageFrom(items, { size: 10, token: "3" }, 2)).toEqual({ items: [4, 5] });
  });
});

describe("mapPage", () => {
  it("maps the items of a page, keeping its token", () => {
    expect(mapPage({ items: [1, 2], nextToken: "2" }, n => n * 10)).toEqual({
      items: [10, 20],
      nextToken: "2",
    });
  });

  it("keeps a page without items as it is", () => {
    expect(mapPage<number, number>({ nextToken: "2" }, n => n * 10)).toEqual({ nextToken: "2" });
  });
});
