import type { EarnPositionStatus } from "@domain/entity-earn-position";
import type { StakePositionSnapshot, StakePositionState } from "../types";
import {
  STAKE_POSITION_MAX_DATA_AGE_MS,
  getExitAction,
  getExitAmount,
  getPositionNotice,
  isPositionDataStale,
  isStatusConsistent,
  toChainExit,
  toDisplayedState,
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

  it("should offer to deactivate, never to withdraw, an active position with an excess to withdraw", () => {
    expect(getExitAction(snapshot({ state: "active", withdrawableAmount: 3n }))).toBe("deactivate");
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

describe("getExitAmount", () => {
  const position = snapshot({ amount: 5n, withdrawableAmount: 7n });

  it("should name the staked amount of the chain snapshot for a deactivation", () => {
    expect(getExitAmount(position, "deactivate")).toBe(5n);
  });

  it("should name the withdrawable amount of the chain snapshot for a withdrawal", () => {
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
      "inactive without the withdraw authority, as under a lockup",
      snapshot({ state: "inactive", canWithdraw: false }),
      "missingAuthority",
    ],
    ["active and controlled", snapshot(), null],
    ["inactive and controlled", snapshot({ state: "inactive", withdrawableAmount: 7n }), null],
  ])("should explain a position %s with %p", (_case, position, notice) => {
    expect(getPositionNotice(position)).toBe(notice);
  });
});

describe("toChainExit", () => {
  it("should deactivate an active position the account controls", () => {
    expect(toChainExit(snapshot(), false)).toEqual({
      state: "active",
      action: "deactivate",
      notice: null,
      isPending: false,
    });
  });

  it("should withdraw an inactive position with an amount to withdraw", () => {
    expect(toChainExit(snapshot({ state: "inactive", withdrawableAmount: 7n }), false)).toEqual({
      state: "inactive",
      action: "withdraw",
      notice: null,
      isPending: false,
    });
  });

  it("should offer no exit and explain a deactivating position", () => {
    expect(toChainExit(snapshot({ state: "deactivating" }), false)).toEqual({
      state: "deactivating",
      action: null,
      notice: "deactivating",
      isPending: false,
    });
  });

  it("should offer no exit for an inactive position under a lockup", () => {
    const exit = toChainExit(
      snapshot({ state: "inactive", withdrawableAmount: 7n, canWithdraw: false }),
      false,
    );

    expect(exit).toMatchObject({ action: null, notice: "missingAuthority" });
  });

  it("should carry whether the account is syncing, and no amount", () => {
    const exit = toChainExit(snapshot({ amount: 12n }), true);

    expect(exit.isPending).toBe(true);
    expect(Object.keys(exit)).toEqual(["state", "action", "notice", "isPending"]);
  });
});

describe("toDisplayedState", () => {
  it.each<[EarnPositionStatus, StakePositionState | null]>([
    ["activated", "active"],
    ["activating", "activating"],
    ["deactivating", "deactivating"],
    ["deactivated", "inactive"],
    ["archived", null],
    ["unknown", null],
  ])("should show the %s status as %p", (status, state) => {
    expect(toDisplayedState(status)).toBe(state);
  });
});

describe("isStatusConsistent", () => {
  it.each<[EarnPositionStatus, StakePositionState]>([
    ["activated", "active"],
    ["activating", "activating"],
    ["deactivating", "deactivating"],
    ["deactivated", "inactive"],
  ])("should agree when the backend says %s and the chain %s", (status, chainState) => {
    expect(isStatusConsistent(status, chainState)).toBe(true);
  });

  it("should disagree when the backend says activated and the chain inactive", () => {
    expect(isStatusConsistent("activated", "inactive")).toBe(false);
  });

  it("should disagree for a status the details cannot show", () => {
    expect(isStatusConsistent("unknown", "active")).toBe(false);
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
