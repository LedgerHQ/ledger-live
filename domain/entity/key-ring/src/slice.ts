import { createSlice, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import type { KeyRingMemberKeyRecord, KeyRingState, KeyRingTreeRecord } from "./types";

/** A fresh instance: no key tree, no member key. The trust package generates the key at boot. */
export const keyRingInitialState: KeyRingState = {
  trustchain: null,
  memberCredentials: null,
};

/**
 * The key ring state of this instance, mounted by both apps under `trustchain` with the
 * persisted shape of Ledger Sync v1, so existing app data reloads unchanged. Key generation and
 * persisted-state validation live in `@features/platform-key-ring`, which dispatches its actions.
 *
 * @example
 * ```ts
 * import keyRingReducer from "@domain/entity-key-ring";
 *
 * const reducers = { trustchain: keyRingReducer };
 * ```
 */
export const keyRingSlice = createSlice({
  // The Redux key and the persisted key of both apps: never rename it.
  name: "trustchain",
  initialState: keyRingInitialState,
  reducers: {
    /** Replaces the whole state at boot. The trust package checks the member key first. */
    keyRingStateImported(_state, { payload }: PayloadAction<KeyRingState>) {
      return payload;
    },
    /** Leaves the key tree and keeps only the new member key in the payload. */
    keyRingReset(_state, { payload }: PayloadAction<KeyRingMemberKeyRecord>) {
      return { ...keyRingInitialState, memberCredentials: payload };
    },
    /** Stores the key tree this instance is a member of, replacing the previous one. */
    keyRingTreeSet(state, { payload }: PayloadAction<KeyRingTreeRecord>) {
      state.trustchain = payload;
    },
    /** Stores a new member key, keeping the key tree. */
    keyRingMemberKeySet(state, { payload }: PayloadAction<KeyRingMemberKeyRecord>) {
      state.memberCredentials = payload;
    },
  },
  selectors: {
    /**
     * The whole slice, member key and Ledger Sync key included. Reserved to
     * `@features/platform-key-ring`: the apps ban it by lint, features use the selectors below.
     */
    selectKeyRingSecrets(state): KeyRingState {
      return state;
    },
    /** This instance is a member of a key tree, identified or not. */
    selectIsKeyRingMember(state): boolean {
      return state.trustchain !== null;
    },
    /** Ledger Sync is active on this instance: it is a member of an identified key tree. */
    selectIsLedgerSyncActive(state): boolean {
      return Boolean(state.trustchain?.rootId);
    },
    /** The id of the key tree this instance belongs to, or null. Public, holds no key. */
    selectKeyRingTreeId(state): string | null {
      return state.trustchain?.rootId ?? null;
    },
    /** This instance has a member key, whether or not it joined a key tree. */
    selectHasKeyRingMemberKey(state): boolean {
      return state.memberCredentials !== null;
    },
  },
});

/**
 * The slice's action creators. The trust package builds their payloads (generated keys, the
 * persisted state checked for its member key) and returns them from `importPersistedKeyRingState`,
 * `resetKeyRingState`, `commitKeyRingTree` and `commitKeyRingMemberKey`: call those, not these.
 */
export const { keyRingStateImported, keyRingReset, keyRingTreeSet, keyRingMemberKeySet } =
  keyRingSlice.actions;

/**
 * Matches every action of the key ring slice. The desktop persistence middleware saves the
 * `trustchain` slice on it.
 *
 * @example
 * ```ts
 * if (isKeyRingAction(action)) {
 *   const result = next(action);
 *   setKey("app", "trustchain", selectPersistedKeyRingState(store.getState()));
 *   return result;
 * }
 * ```
 */
export const isKeyRingAction = isAnyOf(
  keyRingStateImported,
  keyRingReset,
  keyRingTreeSet,
  keyRingMemberKeySet,
);

/**
 * The slice's selectors, each on the root state that mounts the slice under `trustchain`.
 * Features read `selectIsLedgerSyncActive`, `selectIsKeyRingMember`, `selectKeyRingTreeId` and
 * `selectHasKeyRingMemberKey`; `selectKeyRingSecrets` is for the trust package only.
 */
export const {
  selectKeyRingSecrets,
  selectIsKeyRingMember,
  selectIsLedgerSyncActive,
  selectKeyRingTreeId,
  selectHasKeyRingMemberKey,
} = keyRingSlice.selectors;

/** The `trustchain` reducer both apps mount. */
export default keyRingSlice.reducer;
