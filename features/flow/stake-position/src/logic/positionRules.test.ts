import type { StakePositionSnapshot } from "../types";
import {
  STAKE_POSITION_MAX_DATA_AGE_MS,
  getDisplayedAmount,
  getExitAction,
  getExitAmount,
  getPositionNotice,
  isPositionDataStale,
} from "./positionRules";

const snapshot = (overrides: Partial<StakePositionSnapshot> = {}): StakePositionSnapshot => ({
  state: "active",
  amount: 5n,
  withdrawableAmount: 0n,
  canStake: true,
  canWithdraw: true,
  ...overrides,
});

describe("getExitAction", () => {
  it.each([
    ["active", snapshot({ state: "active" })],
    ["activating", snapshot({ state: "activating" })],
  ])("should offer to deactivate an %s position the account controls", (_state, position) => {
    expect(getExitAction(position)).toBe("deactivate");
  });

  it.each([
    ["active without the stake authority", snapshot({ canStake: false })],
    ["activating without the stake authority", snapshot({ state: "activating", canStake: false })],
    ["deactivating", snapshot({ state: "deactivating", withdrawableAmount: 7n })],
    ["inactive with nothing to withdraw", snapshot({ state: "inactive", withdrawableAmount: 0n })],
    [
      "inactive without the withdraw authority",
      snapshot({ state: "inactive", withdrawableAmount: 7n, canWithdraw: false }),
    ],
  ])("should offer no exit for a position %s", (_case, position) => {
    expect(getExitAction(position)).toBeNull();
  });

  it("should offer to withdraw all of an inactive position the account controls", () => {
    expect(getExitAction(snapshot({ state: "inactive", withdrawableAmount: 7n }))).toBe("withdraw");
  });
});

describe("getDisplayedAmount", () => {
  it("should show the staked amount", () => {
    expect(getDisplayedAmount(snapshot({ amount: 5n, withdrawableAmount: 7n }))).toBe(5n);
  });

  it("should show the withdrawable amount once nothing is staked", () => {
    expect(getDisplayedAmount(snapshot({ amount: 0n, withdrawableAmount: 7n }))).toBe(7n);
  });
});

describe("getExitAmount", () => {
  const position = snapshot({ amount: 5n, withdrawableAmount: 7n });

  it("should deactivate the full staked amount", () => {
    expect(getExitAmount(position, "deactivate")).toBe(5n);
  });

  it("should withdraw the full withdrawable amount", () => {
    expect(getExitAmount(position, "withdraw")).toBe(7n);
  });
});

describe("getPositionNotice", () => {
  it.each([
    ["deactivating", snapshot({ state: "deactivating" }), "deactivating"],
    ["active without the stake authority", snapshot({ canStake: false }), "missingAuthority"],
    [
      "activating without the stake authority",
      snapshot({ state: "activating", canStake: false }),
      "missingAuthority",
    ],
    [
      "inactive without the withdraw authority",
      snapshot({ state: "inactive", canWithdraw: false }),
      "missingAuthority",
    ],
    ["active and controlled", snapshot(), null],
    ["inactive and controlled", snapshot({ state: "inactive", withdrawableAmount: 7n }), null],
  ])("should explain a position %s with %p", (_case, position, notice) => {
    expect(getPositionNotice(position)).toBe(notice);
  });
});

describe("isPositionDataStale", () => {
  const now = 1_000_000;

  it("should sync data older than the maximum age", () => {
    expect(isPositionDataStale(now - STAKE_POSITION_MAX_DATA_AGE_MS - 1, now)).toBe(true);
  });

  it("should keep data exactly as old as the maximum age", () => {
    expect(isPositionDataStale(now - STAKE_POSITION_MAX_DATA_AGE_MS, now)).toBe(false);
  });

  it("should keep data synced in the future", () => {
    expect(isPositionDataStale(now + 1, now)).toBe(false);
  });

  it("should sync data older than a minute", () => {
    expect(STAKE_POSITION_MAX_DATA_AGE_MS).toBe(60_000);
  });
});
