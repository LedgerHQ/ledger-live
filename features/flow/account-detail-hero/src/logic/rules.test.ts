import type { AccountHeroAvailability } from "../hero/types";
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
