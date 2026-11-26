import { configureStore } from "@reduxjs/toolkit";
import { mockKeyRingMemberKeyRecord, mockKeyRingTreeRecord } from "./schema.mock";
import { mockKeyRingState } from "./slice.mock";
import reducer, {
  isKeyRingAction,
  keyRingInitialState,
  keyRingMemberKeySet,
  keyRingReset,
  keyRingStateImported,
  keyRingTreeSet,
  selectHasKeyRingMemberKey,
  selectIsKeyRingMember,
  selectIsLedgerSyncActive,
  selectKeyRingSecrets,
  selectKeyRingTreeId,
} from "./slice";
import type { KeyRingState } from "./types";

function makeStore(preloaded?: KeyRingState) {
  return configureStore({
    reducer: { trustchain: reducer },
    preloadedState: preloaded ? { trustchain: preloaded } : undefined,
  });
}

describe("keyRingSlice reducers", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "" })).toEqual(keyRingInitialState);
  });

  it("keyRingStateImported replaces the state with the payload as is", () => {
    const persisted = { ...mockKeyRingState(), legacyField: "kept" };
    const next = reducer(keyRingInitialState, keyRingStateImported(persisted));
    expect(JSON.stringify(next)).toBe(JSON.stringify(persisted));
  });

  it("keyRingReset drops the key tree and keeps only the new member key", () => {
    const memberKey = mockKeyRingMemberKeyRecord({ pubkey: `03${"d".repeat(64)}` });
    expect(reducer(mockKeyRingState(), keyRingReset(memberKey))).toEqual({
      trustchain: null,
      memberCredentials: memberKey,
    });
  });

  it("keyRingTreeSet replaces the key tree and keeps the member key", () => {
    const state = mockKeyRingState();
    const tree = mockKeyRingTreeRecord({ applicationPath: "m/0'/16'/1'" });
    expect(reducer(state, keyRingTreeSet(tree))).toEqual({ ...state, trustchain: tree });
  });

  it("keyRingMemberKeySet replaces the member key and keeps the key tree", () => {
    const state = mockKeyRingState();
    const memberKey = mockKeyRingMemberKeyRecord({ privatekey: "e".repeat(64) });
    expect(reducer(state, keyRingMemberKeySet(memberKey))).toEqual({
      ...state,
      memberCredentials: memberKey,
    });
  });

  it("uses the trustchain action type namespace", () => {
    expect(keyRingTreeSet(mockKeyRingTreeRecord()).type).toBe("trustchain/keyRingTreeSet");
  });
});

describe("isKeyRingAction", () => {
  it("matches every key ring action and nothing else", () => {
    expect(isKeyRingAction(keyRingStateImported(mockKeyRingState()))).toBe(true);
    expect(isKeyRingAction(keyRingReset(mockKeyRingMemberKeyRecord()))).toBe(true);
    expect(isKeyRingAction(keyRingTreeSet(mockKeyRingTreeRecord()))).toBe(true);
    expect(isKeyRingAction(keyRingMemberKeySet(mockKeyRingMemberKeyRecord()))).toBe(true);
    expect(isKeyRingAction({ type: "trustchain/other" })).toBe(false);
    expect(isKeyRingAction({ type: "TRUSTCHAIN_STORE_RESET" })).toBe(false);
  });
});

describe("keyRingSlice selectors", () => {
  it("reads a member instance", () => {
    const state = makeStore(mockKeyRingState()).getState();
    expect(selectIsKeyRingMember(state)).toBe(true);
    expect(selectIsLedgerSyncActive(state)).toBe(true);
    expect(selectKeyRingTreeId(state)).toBe("mock-root-id");
    expect(selectHasKeyRingMemberKey(state)).toBe(true);
    expect(selectKeyRingSecrets(state)).toBe(state.trustchain);
  });

  it("reads an instance with a member key and no key tree", () => {
    const state = makeStore(mockKeyRingState({ trustchain: null })).getState();
    expect(selectIsKeyRingMember(state)).toBe(false);
    expect(selectIsLedgerSyncActive(state)).toBe(false);
    expect(selectKeyRingTreeId(state)).toBeNull();
    expect(selectHasKeyRingMemberKey(state)).toBe(true);
  });

  it("reads Ledger Sync as inactive when the key tree has no root id", () => {
    const state = makeStore(
      mockKeyRingState({ trustchain: mockKeyRingTreeRecord({ rootId: "" }) }),
    ).getState();
    expect(selectIsKeyRingMember(state)).toBe(true);
    expect(selectIsLedgerSyncActive(state)).toBe(false);
  });

  it("reads the empty state", () => {
    const state = makeStore().getState();
    expect(selectIsKeyRingMember(state)).toBe(false);
    expect(selectHasKeyRingMemberKey(state)).toBe(false);
  });
});
