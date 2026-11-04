import type { AccountPortfolioAction, AccountPortfolioResult, Run } from "../types";
import { progressOf } from "./portfolioProgress";

const run = (
  action: AccountPortfolioAction,
  {
    portfolioId = "p1",
    ok = true,
    registrations,
  }: { portfolioId?: string; ok?: boolean; registrations?: number } = {},
): Run => {
  const result: AccountPortfolioResult = {
    ok,
    durationMs: 1,
    sent: { method: "GET", url: "u" },
    body: {},
    currency: "usd",
    view:
      registrations === undefined
        ? undefined
        : {
            kind: "portfolio",
            id: portfolioId,
            registrations,
            registrationEntries: [],
            accounts: [],
          },
  };
  return {
    id: 1,
    action,
    at: 0,
    portfolioId,
    request: { action, portfolioId, currency: "usd" },
    result,
  };
};

describe("progressOf", () => {
  it("ignores a failed call and a call on another portfolio", () => {
    expect(progressOf([run("createPortfolio", { ok: false })], "p1").created).toBe(false);
    expect(progressOf([run("createPortfolio", { portfolioId: "other" })], "p1").created).toBe(
      false,
    );
  });

  it("trusts the latest read of the portfolio over the calls before it", () => {
    expect(
      progressOf([run("getPortfolio", { registrations: 0 }), run("registerAccounts")], "p1")
        .registered,
    ).toBe(false);
    expect(progressOf([run("getPortfolio", { registrations: 3 })], "p1")).toEqual({
      created: true,
      registered: true,
    });
  });
});
