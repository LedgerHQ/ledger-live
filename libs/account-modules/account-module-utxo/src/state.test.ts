import { UtxoAccountNotSyncedError, emptyState, readState, versioned } from "./state";
import { UTXO_ACCOUNT_STATE_VERSION, type UtxoAccountState } from "./types";

describe("readState", () => {
  it("reads a state of the current version", () => {
    expect(readState(versioned(emptyState()))).toEqual(emptyState());
    expect(versioned(emptyState()).version).toBe(UTXO_ACCOUNT_STATE_VERSION);
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
  ])("does not trust %s", (_, state) => {
    expect(
      readState(state as never as { version: number; data: UtxoAccountState }),
    ).toBeUndefined();
  });
});

describe("UtxoAccountNotSyncedError", () => {
  it("names itself", () => {
    expect(new UtxoAccountNotSyncedError()).toMatchObject({ name: "UtxoAccountNotSyncedError" });
  });
});
