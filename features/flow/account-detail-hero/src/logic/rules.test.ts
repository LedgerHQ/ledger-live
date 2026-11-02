import type { AccountHeroAvailability } from "../hero/types";
import { hasAccountActivity } from "./hasAccountActivity";
import { resolveAccountCountervalue } from "./resolveAccountCountervalue";
import { resolveAccountHeroAvailability } from "./resolveAccountHeroAvailability";
import { resolveEmptyState } from "./resolveEmptyState";
import { resolveEmptyStateDescription } from "./resolveEmptyStateDescription";
import { resolveSwapConsole } from "./resolveSwapConsole";

const availability = (
  overrides: Partial<AccountHeroAvailability> = {},
): AccountHeroAvailability => ({
  isCurrencySupported: true,
  isBuyAvailable: true,
  isSellAvailable: true,
  isSwapAvailable: true,
  isEarnAvailable: true,
  isSendSupported: true,
  isReceiveSupported: true,
  ...overrides,
});

describe("resolveSwapConsole", () => {
  it("shows on desktop when Swap is available", () => {
    expect(resolveSwapConsole("desktop", availability())).toBe(true);
  });

  it("never shows on mobile", () => {
    expect(resolveSwapConsole("mobile", availability())).toBe(false);
  });

  it("hides when Swap is unavailable or the currency unsupported", () => {
    expect(resolveSwapConsole("desktop", availability({ isSwapAvailable: false }))).toBe(false);
    expect(resolveSwapConsole("desktop", availability({ isCurrencySupported: false }))).toBe(false);
  });
});

describe("resolveEmptyState", () => {
  it("is visible without activity and hidden with activity", () => {
    expect(resolveEmptyState({ hasActivity: false, availability: availability() }).isVisible).toBe(
      true,
    );
    expect(resolveEmptyState({ hasActivity: true, availability: availability() }).isVisible).toBe(
      false,
    );
  });

  it.each([
    [{}, ["receive", "swap", "buy"]],
    [{ isBuyAvailable: false }, ["receive", "swap"]],
    [{ isSwapAvailable: false }, ["receive", "buy"]],
    [{ isBuyAvailable: false, isSwapAvailable: false }, ["receive"]],
    [{ isCurrencySupported: false }, ["receive"]],
    [{ isReceiveSupported: false }, ["swap", "buy"]],
  ])("lists the funding actions for %o", (overrides, expected) => {
    expect(
      resolveEmptyState({ hasActivity: false, availability: availability(overrides) })
        .fundingActions,
    ).toEqual(expected);
  });
});

describe("resolveAccountHeroAvailability", () => {
  const support = { isCurrencySupported: true, isSendSupported: false, isReceiveSupported: true };

  it("makes an action available when one asset of the account supports it", () => {
    expect(
      resolveAccountHeroAvailability({ buy: ["eth"], sell: [], swap: ["eth"], earn: [] }, support),
    ).toEqual({
      ...support,
      isBuyAvailable: true,
      isSellAvailable: false,
      isSwapAvailable: true,
      isEarnAvailable: false,
    });
  });
});

describe("hasAccountActivity", () => {
  const empty = { operations: [], pendingOperations: [] };

  it("has no activity without any operation", () => {
    expect(hasAccountActivity({ ...empty, subAccounts: [empty] })).toBe(false);
  });

  it("counts operations and pending operations of the account and its tokens", () => {
    expect(hasAccountActivity({ ...empty, pendingOperations: [{}] })).toBe(true);
    expect(hasAccountActivity({ ...empty, subAccounts: [{ ...empty, operations: [{}] }] })).toBe(
      true,
    );
  });
});

const valuedAsset = (currency: string, balance: number) => ({
  currency,
  account: { balance: { isZero: () => balance === 0, value: balance } },
});
const quotes: Record<string, number> = { eth: 2, usdc: 1 };
const calculate = (currency: string, balance: { value: number }) =>
  currency in quotes ? { toNumber: () => quotes[currency] * balance.value } : undefined;

describe("resolveAccountCountervalue", () => {
  it("sums the countervalues of the coin and its tokens", () => {
    expect(
      resolveAccountCountervalue([valuedAsset("eth", 3), valuedAsset("usdc", 4)], calculate),
    ).toBe(10);
  });

  it("is zero when every balance is zero, even without quotes", () => {
    expect(
      resolveAccountCountervalue([valuedAsset("pol", 0), valuedAsset("dai", 0)], calculate),
    ).toBe(0);
  });

  it("is unknown when no funded asset has a quote", () => {
    expect(
      resolveAccountCountervalue([valuedAsset("eth", 0), valuedAsset("pol", 5)], calculate),
    ).toBeUndefined();
  });

  it("skips funded assets without a quote", () => {
    expect(
      resolveAccountCountervalue([valuedAsset("eth", 1), valuedAsset("pol", 5)], calculate),
    ).toBe(2);
  });
});

describe("resolveEmptyStateDescription", () => {
  it.each([
    [["receive"], "receive"],
    [["receive", "swap"], "receiveSwap"],
    [["receive", "buy"], "receiveBuy"],
    [["receive", "swap", "buy"], "receiveSwapBuy"],
    [["swap"], "swap"],
    [["buy"], "buy"],
    [["swap", "buy"], "swapBuy"],
  ] as const)("describes %o as %s", (actions, expected) => {
    expect(resolveEmptyStateDescription(actions)).toBe(expected);
  });

  it("does not depend on the order of the actions", () => {
    expect(resolveEmptyStateDescription(["buy", "receive", "swap"])).toBe("receiveSwapBuy");
  });

  it("has no description without any funding action", () => {
    expect(resolveEmptyStateDescription([])).toBeUndefined();
  });
});
