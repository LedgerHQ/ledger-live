import { resolveQuickActions } from "./resolveQuickActions";
import type { CurrencyQuickActionsInputs, QuickAction, WalletQuickActionsInputs } from "./types";

const ids = (actions: readonly QuickAction[]) => actions.map(({ id }) => id);
const stateOf = (actions: readonly QuickAction[], id: QuickAction["id"]) =>
  actions.find(action => action.id === id)?.state;

const wallet = (overrides: Partial<WalletQuickActionsInputs> = {}): WalletQuickActionsInputs => ({
  scope: "wallet",
  platform: "desktop",
  hasSigner: true,
  hasFunds: true,
  isExchangeEnabled: true,
  ...overrides,
});

const currency = (
  overrides: Partial<CurrencyQuickActionsInputs> = {},
): CurrencyQuickActionsInputs => ({
  scope: "asset",
  platform: "desktop",
  isCurrencySupported: true,
  hasAccounts: true,
  hasFunds: true,
  isBuyAvailable: true,
  isSellAvailable: true,
  isSwapAvailable: true,
  isEarnAvailable: true,
  ...overrides,
});

describe("resolveQuickActions", () => {
  describe("wallet scope", () => {
    it.each(["desktop", "mobile"] as const)(
      "offers Connect and Buy a Ledger without a signer on %s",
      platform => {
        const actions = resolveQuickActions(wallet({ platform, hasSigner: false }));

        expect(actions).toEqual([
          { id: "connect", state: "active" },
          { id: "buyLedger", state: "active" },
        ]);
      },
    );

    it("desktop: Receive, Buy, Sell, Send with funds", () => {
      const actions = resolveQuickActions(wallet());

      expect(ids(actions)).toEqual(["receive", "buy", "sell", "send"]);
      expect(actions.every(({ state }) => state === "active")).toBe(true);
    });

    it("desktop: Sell and Send inactive without funds", () => {
      const actions = resolveQuickActions(wallet({ hasFunds: false }));

      expect(stateOf(actions, "receive")).toBe("active");
      expect(stateOf(actions, "buy")).toBe("active");
      expect(stateOf(actions, "sell")).toBe("inactive");
      expect(stateOf(actions, "send")).toBe("inactive");
    });

    it("mobile: Transfer, Swap, Buy, whatever the funds", () => {
      const actions = resolveQuickActions(wallet({ platform: "mobile", hasFunds: false }));

      expect(actions).toEqual([
        { id: "transfer", state: "active" },
        { id: "swap", state: "active" },
        { id: "buy", state: "active" },
      ]);
    });

    it("mobile: Swap and Buy inactive when the exchange is disabled", () => {
      const actions = resolveQuickActions(wallet({ platform: "mobile", isExchangeEnabled: false }));

      expect(stateOf(actions, "transfer")).toBe("active");
      expect(stateOf(actions, "swap")).toBe("inactive");
      expect(stateOf(actions, "buy")).toBe("inactive");
    });
  });

  describe.each(["asset", "account"] as const)("%s scope", scope => {
    it("desktop: shows nothing when the currency is not supported", () => {
      expect(resolveQuickActions(currency({ scope, isCurrencySupported: false }))).toEqual([]);
    });

    it("mobile: keeps only Transfer when the currency is not supported", () => {
      expect(
        resolveQuickActions(currency({ scope, platform: "mobile", isCurrencySupported: false })),
      ).toEqual([{ id: "transfer", state: "active" }]);
    });

    describe("desktop", () => {
      it("Receive, Send, Buy, Sell, Earn when everything is available", () => {
        const actions = resolveQuickActions(currency({ scope }));

        expect(ids(actions)).toEqual(["receive", "send", "buy", "sell", "earn"]);
        expect(actions.every(({ state }) => state === "active")).toBe(true);
      });

      it("hides Buy when the currency is not on the ramp", () => {
        const actions = resolveQuickActions(currency({ scope, isBuyAvailable: false }));

        expect(ids(actions)).toEqual(["receive", "send", "sell", "earn"]);
      });

      it("hides Earn when staking does not support the currency", () => {
        const actions = resolveQuickActions(currency({ scope, isEarnAvailable: false }));

        expect(ids(actions)).toEqual(["receive", "send", "buy", "sell"]);
      });

      it("keeps Earn shown but inactive without funds", () => {
        const actions = resolveQuickActions(currency({ scope, hasFunds: false }));

        expect(stateOf(actions, "earn")).toBe("inactive");
      });

      it("hides Sell when the currency is not on the ramp", () => {
        const actions = resolveQuickActions(currency({ scope, isSellAvailable: false }));

        expect(ids(actions)).toEqual(["receive", "send", "buy", "earn"]);
      });

      it("keeps Sell and Send inactive without funds", () => {
        const actions = resolveQuickActions(currency({ scope, hasFunds: false }));

        expect(stateOf(actions, "receive")).toBe("active");
        expect(stateOf(actions, "sell")).toBe("inactive");
        expect(stateOf(actions, "send")).toBe("inactive");
      });
    });
  });
  describe("asset scope on mobile", () => {
    const mobile = (overrides: Partial<CurrencyQuickActionsInputs> = {}) =>
      resolveQuickActions(currency({ scope: "asset", platform: "mobile", ...overrides }));

    it("Transfer, Buy, Swap, Sell, Earn when everything is available", () => {
      expect(ids(mobile())).toEqual(["transfer", "buy", "swap", "sell", "earn"]);
    });

    it("hides Transfer without accounts", () => {
      expect(ids(mobile({ hasAccounts: false }))).not.toContain("transfer");
    });

    it("hides Buy, Swap and Earn when unavailable", () => {
      const actions = mobile({
        isBuyAvailable: false,
        isSwapAvailable: false,
        isEarnAvailable: false,
      });

      expect(ids(actions)).toEqual(["transfer", "sell"]);
    });

    it("hides Sell without funds or when not on the ramp", () => {
      expect(ids(mobile({ hasFunds: false }))).not.toContain("sell");
      expect(ids(mobile({ isSellAvailable: false }))).not.toContain("sell");
    });

    it("shows Earn without funds", () => {
      expect(ids(mobile({ hasFunds: false }))).toContain("earn");
    });
  });

  describe("account scope on mobile", () => {
    const mobile = (overrides: Partial<CurrencyQuickActionsInputs> = {}) =>
      resolveQuickActions(currency({ scope: "account", platform: "mobile", ...overrides }));

    it("Transfer, Buy, Swap, Sell, Earn when funded and everything is available", () => {
      expect(ids(mobile())).toEqual(["transfer", "buy", "swap", "sell", "earn"]);
    });

    it("keeps only Transfer, Swap and Buy without funds", () => {
      expect(mobile({ hasFunds: false })).toEqual([
        { id: "transfer", state: "active" },
        { id: "swap", state: "active" },
        { id: "buy", state: "active" },
      ]);
    });

    it("drops Swap and Buy without funds when they are unavailable", () => {
      expect(ids(mobile({ hasFunds: false, isSwapAvailable: false }))).toEqual(["transfer", "buy"]);
      expect(ids(mobile({ hasFunds: false, isBuyAvailable: false }))).toEqual(["transfer", "swap"]);
      expect(
        ids(mobile({ hasFunds: false, isSwapAvailable: false, isBuyAvailable: false })),
      ).toEqual(["transfer"]);
    });
  });
});
