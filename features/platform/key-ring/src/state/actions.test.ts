import { configureStore } from "@reduxjs/toolkit";
import keyRingReducer, {
  KeyRingMemberKeyRecordSchema,
  keyRingInitialState,
  type KeyRingState,
} from "@domain/entity-key-ring";
import { mockKeyRingTreeRecord } from "@domain/entity-key-ring/schema.mock";
import {
  getInitialStore,
  importTrustchainStoreState,
  resetTrustchainStore,
  setMemberCredentials,
  setTrustchain,
  trustchainHandlers,
  type TrustchainHandlers,
  type TrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { treeUpdateOf, memberKeyUpdateOf } from "../internals/handles";
import type { KeyRingAction, KeyRingThunk } from "../types";
import {
  commitKeyRingMemberKey,
  commitKeyRingTree,
  importPersistedKeyRingState,
  resetKeyRingState,
} from "./actions";
import { selectPersistedKeyRingState } from "./persistence";
import { keyRingRuntimeExtra } from "./runtime";

// The shape both apps store: desktop `app.json` key `trustchain`, mobile storage key `trustchain`.
const DESKTOP_APP_JSON_TRUSTCHAIN = JSON.parse(
  JSON.stringify({
    trustchain: {
      rootId: `02${"84".repeat(32)}`,
      walletSyncEncryptionKey: "1f".repeat(32),
      applicationPath: "m/0'/16'/0'",
    },
    memberCredentials: {
      pubkey: `02${"e3".repeat(32)}`,
      privatekey: "87".repeat(32),
    },
  }),
);
const MOBILE_STORAGE_TRUSTCHAIN = JSON.parse(
  JSON.stringify({
    trustchain: null,
    memberCredentials: {
      pubkey: `03${"a1".repeat(32)}`,
      privatekey: "11".repeat(32),
    },
  }),
);

function v1Reducer(
  state: TrustchainStore | undefined,
  action: { type: string; payload?: unknown },
) {
  const handlers = trustchainHandlers as unknown as TrustchainHandlers<false>;
  const handler = handlers[action.type as keyof TrustchainHandlers<false>];
  const current = state ?? getInitialStore();
  return handler ? handler(current, action as never) : current;
}

// The state a key ring thunk stores, from the one action it dispatches.
function dispatchedState(thunk: KeyRingThunk): KeyRingState {
  const dispatched: KeyRingAction[] = [];
  const extra = keyRingRuntimeExtra({ getState: () => ({ trustchain: keyRingInitialState }) });
  void thunk(action => dispatched.push(action), jest.fn(), extra);
  expect(dispatched).toHaveLength(1);
  return keyRingReducer(undefined, dispatched[0] as never);
}

function makeStore() {
  const extra = keyRingRuntimeExtra({ getState: () => store.getState() });
  const store = configureStore({
    reducer: { trustchain: keyRingReducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware({ thunk: { extraArgument: extra } }),
  });
  return store;
}

describe("importPersistedKeyRingState", () => {
  it.each([
    ["the desktop app.json shape", DESKTOP_APP_JSON_TRUSTCHAIN],
    ["the mobile storage shape", MOBILE_STORAGE_TRUSTCHAIN],
  ])("reloads %s identically and persists it back unchanged", (_label, persisted) => {
    const store = makeStore();
    store.dispatch(importPersistedKeyRingState(persisted));

    const saved = JSON.stringify(selectPersistedKeyRingState(store.getState()));
    expect(saved).toBe(JSON.stringify(persisted));
    expect(saved).toBe(JSON.stringify(v1Reducer(undefined, importTrustchainStoreState(persisted))));
  });

  it("keeps unknown fields of a valid persisted state, as v1 did", () => {
    const persisted = { ...DESKTOP_APP_JSON_TRUSTCHAIN, legacy: 1 };
    const store = makeStore();
    store.dispatch(importPersistedKeyRingState(persisted));
    expect(store.getState().trustchain).toEqual(persisted);
  });

  it.each([
    ["nothing persisted", undefined],
    [
      "a state without member key",
      { trustchain: mockKeyRingTreeRecord(), memberCredentials: null },
    ],
    [
      "an invalid member key",
      { trustchain: null, memberCredentials: { pubkey: "nope", privatekey: "nope" } },
    ],
  ])("starts over with a new member key on %s, as v1 did", (_label, persisted) => {
    const ours = dispatchedState(importPersistedKeyRingState(persisted));
    const theirs = importTrustchainStoreState(persisted as TrustchainStore | undefined).payload
      .trustchain;

    expect(ours.trustchain).toBeNull();
    expect(KeyRingMemberKeyRecordSchema.safeParse(ours.memberCredentials).success).toBe(true);
    expect(Object.keys(ours)).toEqual(Object.keys(theirs ?? {}));
    expect(ours.memberCredentials).not.toEqual(theirs?.memberCredentials);
  });
});

describe("key ring actions match the v1 store handlers", () => {
  it("reset keeps only a new valid member key", () => {
    const v1 = v1Reducer(DESKTOP_APP_JSON_TRUSTCHAIN, resetTrustchainStore());
    const store = makeStore();
    store.dispatch(importPersistedKeyRingState(DESKTOP_APP_JSON_TRUSTCHAIN));
    store.dispatch(resetKeyRingState());
    const ours = store.getState().trustchain;

    expect(ours.trustchain).toBe(v1.trustchain);
    expect(Object.keys(ours)).toEqual(Object.keys(v1));
    expect(KeyRingMemberKeyRecordSchema.safeParse(ours.memberCredentials).success).toBe(true);
  });

  it("commitKeyRingTree sets the key tree like setTrustchain", () => {
    const tree = mockKeyRingTreeRecord({ applicationPath: "m/0'/16'/1'" });
    const store = makeStore();
    store.dispatch(importPersistedKeyRingState(DESKTOP_APP_JSON_TRUSTCHAIN));
    store.dispatch(commitKeyRingTree(treeUpdateOf(tree)));

    expect(store.getState().trustchain).toEqual(
      v1Reducer(DESKTOP_APP_JSON_TRUSTCHAIN, setTrustchain(tree)),
    );
  });

  it("commitKeyRingMemberKey sets the member key like setMemberCredentials", () => {
    const memberKey = MOBILE_STORAGE_TRUSTCHAIN.memberCredentials;
    const store = makeStore();
    store.dispatch(commitKeyRingMemberKey(memberKeyUpdateOf(memberKey)));

    expect(store.getState().trustchain).toEqual(
      v1Reducer(keyRingInitialState, setMemberCredentials(memberKey)),
    );
  });

  it("rejects an update this package did not issue", () => {
    expect(() => commitKeyRingTree({ kind: "KeyRingTreeUpdate" })).toThrow(
      "Unknown key ring tree update",
    );
  });
});

describe("the key ring thunks on the v1 runtime", () => {
  it.each([
    ["the boot import", () => importPersistedKeyRingState(undefined)],
    ["the reset", () => resetKeyRingState()],
  ])("should store a new member key within the dispatch of %s", (_case, thunk) => {
    const store = makeStore();
    const notifiedStates: string[] = [];
    store.subscribe(() => notifiedStates.push(JSON.stringify(store.getState().trustchain)));

    const stored = store.dispatch(thunk());

    expect(notifiedStates).toHaveLength(1);
    const { memberCredentials } = store.getState().trustchain;
    expect(KeyRingMemberKeyRecordSchema.safeParse(memberCredentials).success).toBe(true);
    expect(notifiedStates[0]).toBe(JSON.stringify(store.getState().trustchain));
    return expect(stored).resolves.toBeUndefined();
  });

  it.each([
    ["no thunk extra argument", undefined],
    ["an extra argument without runtime", { other: "service" }],
    ["a runtime this package did not build", { keyRingRuntime: { kind: "KeyRingRuntime" } }],
  ])("should throw a clear error on a store with %s", (_case, extraArgument) => {
    const store = configureStore({
      reducer: { trustchain: keyRingReducer },
      middleware: getDefaultMiddleware => getDefaultMiddleware({ thunk: { extraArgument } }),
    });

    for (const thunk of [importPersistedKeyRingState(undefined), resetKeyRingState()]) {
      expect(() => store.dispatch(thunk)).toThrow(
        expect.objectContaining({ name: "KeyRingRuntimeMissingError" }),
      );
    }
    expect(store.getState().trustchain).toBe(keyRingInitialState);
  });
});
