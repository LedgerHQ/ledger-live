import { emptyState, readState, versioned } from "./state";
import { SINGLE_ADDRESS_ACCOUNT_STATE_VERSION, type SingleAddressAccountState } from "./types";

describe("readState", () => {
  it("trusts a well formed state of the current version", () => {
    const data: SingleAddressAccountState = { syncedHeight: 12, balances: [], stakes: [] };
    expect(readState(versioned(data))).toBe(data);
    expect(versioned(data).version).toBe(SINGLE_ADDRESS_ACCOUNT_STATE_VERSION);
  });

  it("does not trust a missing state, or one of another version", () => {
    expect(readState(undefined)).toBeUndefined();
    expect(readState({ version: 0, data: emptyState() })).toBeUndefined();
  });

  it.each([
    ["no data", null],
    ["no synced height", { balances: [], stakes: [] }],
    ["no balances", { syncedHeight: 1, stakes: [] }],
    ["no stakes", { syncedHeight: 1, balances: [] }],
  ])("does not trust a state with %s", (_, data) => {
    expect(
      readState({ version: SINGLE_ADDRESS_ACCOUNT_STATE_VERSION, data: data as never }),
    ).toBeUndefined();
  });
});
