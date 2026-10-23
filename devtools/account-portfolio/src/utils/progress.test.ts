import type { AccountPortfolioAction, AccountPortfolioResult, Run } from "../types";
import { progressOf } from "./progress";

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
  return { id: 1, action, at: 0, portfolioId, result };
};

describe("progressOf", () => {
  it("has done nothing before any call", () => {
    expect(progressOf([], "p1")).toEqual({ created: false, registered: false });
  });

  it("is created once a call on that portfolio worked", () => {
    expect(progressOf([run("createPortfolio")], "p1")).toEqual({
      created: true,
      registered: false,
    });
  });

  it("ignores failed calls and the calls on another portfolio", () => {
    expect(progressOf([run("createPortfolio", { ok: false })], "p1").created).toBe(false);
    expect(progressOf([run("createPortfolio", { portfolioId: "other" })], "p1").created).toBe(
      false,
    );
  });

  it("is registered once accounts were registered", () => {
    expect(progressOf([run("registerAccounts"), run("createPortfolio")], "p1")).toEqual({
      created: true,
      registered: true,
    });
  });

  it("trusts the latest read of the portfolio over the calls that came before it", () => {
    const emptied = [run("getPortfolio", { registrations: 0 }), run("registerAccounts")];
    expect(progressOf(emptied, "p1").registered).toBe(false);

    const filled = [run("getPortfolio", { registrations: 3 })];
    expect(progressOf(filled, "p1")).toEqual({ created: true, registered: true });
  });
});
