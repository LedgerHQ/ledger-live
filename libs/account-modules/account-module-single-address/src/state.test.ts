import { createMemoryStateStore } from "@ledgerhq/account-module-framework";
import { emptyState, readState, storedState, versioned } from "./state";
import { SINGLE_ADDRESS_ACCOUNT_STATE_VERSION, type SingleAddressAccountState } from "./types";

const refreshedAt = { balances: 1, stakes: 2, operations: 3 };

describe("readState", () => {
  it("trusts a well formed state of the current version", () => {
    const data: SingleAddressAccountState = {
      syncedHeight: 12,
      balances: [],
      stakes: [],
      refreshedAt,
    };
    expect(readState(versioned(data))).toBe(data);
    expect(versioned(data).version).toBe(SINGLE_ADDRESS_ACCOUNT_STATE_VERSION);
    expect(SINGLE_ADDRESS_ACCOUNT_STATE_VERSION).toBe(2);
  });

  it("migrates a version 1 state, whose refresh times are not known: never", () => {
    const balances = [{ value: "5", asset: { type: "native" } }];
    expect(
      readState({ version: 1, data: { syncedHeight: 12, balances, stakes: [] } as never }),
    ).toEqual({
      syncedHeight: 12,
      balances,
      stakes: [],
      refreshedAt: { balances: 0, stakes: 0, operations: 0 },
    });
  });

  it("does not trust a missing state, or one of another version", () => {
    expect(readState(undefined)).toBeUndefined();
    expect(readState({ version: 0, data: emptyState() })).toBeUndefined();
    expect(readState({ version: 3, data: emptyState() })).toBeUndefined();
  });

  it.each([
    ["no data", 2, null],
    ["no synced height", 2, { balances: [], stakes: [], refreshedAt }],
    ["no balances", 2, { syncedHeight: 1, stakes: [], refreshedAt }],
    ["no stakes", 2, { syncedHeight: 1, balances: [], refreshedAt }],
    ["no refresh times", 2, { syncedHeight: 1, balances: [], stakes: [] }],
    ["null refresh times", 2, { syncedHeight: 1, balances: [], stakes: [], refreshedAt: null }],
    [
      "a refresh time missing",
      2,
      { syncedHeight: 1, balances: [], stakes: [], refreshedAt: { balances: 1, stakes: 2 } },
    ],
    ["version 1, no balances", 1, { syncedHeight: 1, stakes: [] }],
  ])("does not trust a state with %s", (_, version, data) => {
    expect(readState({ version, data: data as never })).toBeUndefined();
  });
});

describe("storedState", () => {
  it("reads the store, in the current version", async () => {
    const data = { ...emptyState(), syncedHeight: 7, refreshedAt };
    expect(await storedState(createMemoryStateStore(versioned(data)))).toEqual(data);
  });

  it("is empty for an account never synced, or whose state is not trusted", async () => {
    expect(await storedState(createMemoryStateStore())).toEqual(emptyState());
    expect(await storedState(createMemoryStateStore({ version: 0, data: emptyState() }))).toEqual(
      emptyState(),
    );
  });
});
