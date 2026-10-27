import { redactPortfolioSourceAction, redactPortfolioSourceState } from "./redaction";
import {
  portfolioIdAssigned,
  portfolioListed,
  portfolioOutcomesRecorded,
  portfolioSourceEnabled,
} from "./slice";

const ADDRESS = "0xabababababababababababababababababababab";

describe("redactPortfolioSourceAction", () => {
  it("drops the identifiers the source's actions carry", () => {
    const actions = [
      portfolioIdAssigned("ledger-live-secret"),
      portfolioListed({
        portfolioId: "ledger-live-secret",
        portfolio: { id: "p", registrations: [{ id: "r", type: "evm", address: ADDRESS }] },
        at: 0,
      }),
      portfolioOutcomesRecorded({
        portfolioId: "ledger-live-secret",
        outcomes: { a: { outcome: "ok", serverIds: [`ethereum:${ADDRESS}`], rows: 1, at: 0 } },
      }),
    ];
    for (const action of actions) {
      const logged = JSON.stringify(redactPortfolioSourceAction(action));
      expect(logged).not.toContain(ADDRESS);
      expect(logged).not.toContain("ledger-live-secret");
      expect(logged).toContain(action.type);
    }
  });

  it("keeps what carries no identifier", () => {
    const action = portfolioSourceEnabled(true);
    expect(redactPortfolioSourceAction(action)).toBe(action);
    const other = { type: "other/action", payload: ADDRESS };
    expect(redactPortfolioSourceAction(other)).toBe(other);
  });
});

describe("redactPortfolioSourceState", () => {
  it("replaces the source's slice", () => {
    expect(
      redactPortfolioSourceState({ accountSourcePortfolio: { portfolioId: "x" }, other: 1 }),
    ).toEqual({
      accountSourcePortfolio: "[REDACTED]",
      other: 1,
    });
  });
});
