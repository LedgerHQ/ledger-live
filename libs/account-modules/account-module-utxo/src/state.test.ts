import { createMemoryStateStore } from "@ledgerhq/account-module-framework";
import { UtxoAccountNotSyncedError, emptyState, readState, storedState, versioned } from "./state";
import { UTXO_ACCOUNT_STATE_VERSION, type UtxoAccountState } from "./types";

describe("readState", () => {
  it("reads a state of the current version", () => {
    expect(readState(versioned(emptyState()))).toEqual(emptyState());
    expect(versioned(emptyState()).version).toBe(UTXO_ACCOUNT_STATE_VERSION);
    expect(UTXO_ACCOUNT_STATE_VERSION).toBe(2);
  });

  it("migrates a version 1 state, the time of its last walk unknown: never", () => {
    const { refreshedAt: _time, ...v1 } = { ...emptyState(), syncedHeight: 12 };
    expect(readState({ version: 1, data: v1 } as never)).toEqual({
      ...emptyState(),
      syncedHeight: 12,
      refreshedAt: 0,
    });
  });

  it.each([
    ["no state", undefined],
    ["another version", { version: 99, data: emptyState() }],
    ["no data", { version: UTXO_ACCOUNT_STATE_VERSION, data: null }],
    [
      "a malformed height",
      { version: UTXO_ACCOUNT_STATE_VERSION, data: { ...emptyState(), syncedHeight: "1" } },
    ],
    [
      "no addresses",
      { version: UTXO_ACCOUNT_STATE_VERSION, data: { ...emptyState(), addresses: null } },
    ],
    [
      "no confirmed outputs",
      { version: UTXO_ACCOUNT_STATE_VERSION, data: { ...emptyState(), confirmedUtxos: {} } },
    ],
    [
      "no outputs",
      { version: UTXO_ACCOUNT_STATE_VERSION, data: { ...emptyState(), utxos: undefined } },
    ],
    [
      "no refresh time",
      { version: UTXO_ACCOUNT_STATE_VERSION, data: { ...emptyState(), refreshedAt: undefined } },
    ],
    ["a malformed version 1", { version: 1, data: { ...emptyState(), utxos: undefined } }],
  ])("does not trust %s", (_, state) => {
    expect(
      readState(state as never as { version: number; data: UtxoAccountState }),
    ).toBeUndefined();
  });
});

describe("storedState", () => {
  it("reads the store, in the current version", async () => {
    const data = { ...emptyState(), syncedHeight: 7, refreshedAt: 5 };
    expect(await storedState(createMemoryStateStore(versioned(data)))).toEqual(data);
    expect(await storedState(createMemoryStateStore())).toBeUndefined();
  });
});

describe("UtxoAccountNotSyncedError", () => {
  it("names itself", () => {
    expect(new UtxoAccountNotSyncedError()).toMatchObject({ name: "UtxoAccountNotSyncedError" });
  });
});
