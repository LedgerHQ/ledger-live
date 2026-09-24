import { resolveCardTransactionsDisplayState } from "./cardTransactionsDisplayState";

describe("resolveCardTransactionsDisplayState", () => {
  it("should stay on loading while the query is in flight", () => {
    expect(
      resolveCardTransactionsDisplayState({
        isLoading: true,
        isError: false,
        hasTransactions: false,
      }),
    ).toBe("loading");
  });

  it("should prefer error over an empty list", () => {
    expect(
      resolveCardTransactionsDisplayState({
        isLoading: false,
        isError: true,
        hasTransactions: false,
      }),
    ).toBe("error");
  });

  it("should use empty when the request succeeded with no transactions", () => {
    expect(
      resolveCardTransactionsDisplayState({
        isLoading: false,
        isError: false,
        hasTransactions: false,
      }),
    ).toBe("empty");
  });

  it("should use ready when the request succeeded with transactions", () => {
    expect(
      resolveCardTransactionsDisplayState({
        isLoading: false,
        isError: false,
        hasTransactions: true,
      }),
    ).toBe("ready");
  });
});
