import { resolveAnalyticsEntry } from "../resolveAnalyticsEntry";

describe("resolveAnalyticsEntry", () => {
  it("should keep only the account and currency of a valid balance card entry", () => {
    expect(
      resolveAnalyticsEntry({
        accountAnalytics: {
          accountId: "eth-account",
          currencyId: "ethereum",
          metric: "balance",
          backPath: "https://invalid.example",
        },
      }),
    ).toEqual({ accountId: "eth-account", currencyId: "ethereum" });
  });

  it.each([
    ["no entry state", undefined],
    [
      "an empty account id",
      { accountAnalytics: { accountId: "", currencyId: "ethereum", metric: "balance" } },
    ],
    [
      "an unsupported metric",
      {
        accountAnalytics: {
          accountId: "eth-account",
          currencyId: "ethereum",
          metric: "total-return",
        },
      },
    ],
  ])("should ignore %s", (_, state) => {
    expect(resolveAnalyticsEntry(state)).toBeUndefined();
  });
});
