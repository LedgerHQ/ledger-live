import type { AccountHeroAvailability } from "../hero/types";
import { hasAccountActivity } from "./hasAccountActivity";
import { resolveAccountHeroAvailability } from "./resolveAccountHeroAvailability";
import { resolveEmptyState } from "./resolveEmptyState";
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
