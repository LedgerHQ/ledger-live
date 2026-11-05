import { parseAnalyticsEntryState } from "./parseAnalyticsEntryState";

describe("parseAnalyticsEntryState", () => {
  it("should keep only the account and currency of a valid balance card entry", () => {
    expect(
      parseAnalyticsEntryState({
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
    ["a null entry state", null],
    ["a state without an analytics entry", { from: "/accounts" }],
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
    expect(parseAnalyticsEntryState(state)).toBeUndefined();
  });
});
