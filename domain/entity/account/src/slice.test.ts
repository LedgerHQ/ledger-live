import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { AccountIdSchema } from "./legacy/schema";
import { AccountsStateSchema, LegacyAccountEntrySchema, initialAccountsState } from "./schema";
import { mockAccountEntry } from "./schema.mock";
import {
  accountsSlice,
  legacyAccountsSynced,
  remoteAccountsAdded,
  remoteAccountsRemoved,
} from "./slice";

const { reducer } = accountsSlice;
const {
  selectAccountEntries,
  selectAccountEntry,
  selectAccountUUIDByLegacyId,
  selectAccountUUIDs,
} = accountsSlice.getSelectors();

const ethId = AccountIdSchema.parse("js:2:ethereum:0x71:");
const btcId = AccountIdSchema.parse("js:2:bitcoin:xpub:native_segwit");
const eth = LegacyAccountEntrySchema.parse(mockAccountEntry({ legacyId: ethId }));
const btc = LegacyAccountEntrySchema.parse(
  mockAccountEntry({ legacyId: btcId, descriptor: mockUtxoAccountDescriptor() }),
);
const remote = mockAccountEntry({
  legacyId: undefined,
  descriptor: mockUtxoAccountDescriptor({ path: "m/84h/0h/1h" }),
});

const withRemote = {
  ids: [remote.accountUUID],
  entities: { [remote.accountUUID]: remote },
  byLegacyId: {},
};

describe("accountsSlice", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "init" })).toEqual(initialAccountsState);
  });

  it("stores the legacy accounts in their order, with their legacy id index", () => {
    const state = reducer(initialAccountsState, legacyAccountsSynced([btc, eth]));
    expect(AccountsStateSchema.safeParse(state).success).toBe(true);
    expect(selectAccountUUIDs(state)).toEqual([btc.accountUUID, eth.accountUUID]);
    expect(selectAccountEntry(state, eth.accountUUID)).toEqual(eth);
    expect(selectAccountUUIDByLegacyId(state, btcId)).toBe(btc.accountUUID);
  });

  it("drops a removed legacy account from the entities and the index", () => {
    const state = reducer(
      reducer(initialAccountsState, legacyAccountsSynced([btc, eth])),
      legacyAccountsSynced([btc]),
    );
    expect(selectAccountEntries(state)).toEqual([btc]);
    expect(selectAccountUUIDByLegacyId(state, ethId)).toBeUndefined();
  });

  it("keeps a remote-only account after the legacy ones", () => {
    const state = reducer(withRemote, legacyAccountsSynced([eth]));
    expect(selectAccountUUIDs(state)).toEqual([eth.accountUUID, remote.accountUUID]);
  });

  it("attaches a remote-only account once the legacy store holds it", () => {
    const local = { ...remote, legacyId: btcId };
    const state = reducer(withRemote, legacyAccountsSynced([local]));
    expect(selectAccountEntries(state)).toEqual([local]);
    expect(selectAccountUUIDByLegacyId(state, btcId)).toBe(remote.accountUUID);
  });

  it("adds remote-only accounts after the others, once each", () => {
    const synced = reducer(initialAccountsState, legacyAccountsSynced([eth]));
    const state = reducer(synced, remoteAccountsAdded([remote, remote]));
    expect(selectAccountUUIDs(state)).toEqual([eth.accountUUID, remote.accountUUID]);
    expect(reducer(state, legacyAccountsSynced([eth]))).toEqual(state);
  });

  it("removes remote-only accounts and keeps the legacy ones", () => {
    const state = reducer(
      reducer(withRemote, legacyAccountsSynced([eth])),
      remoteAccountsRemoved([remote.accountUUID, eth.accountUUID]),
    );
    expect(selectAccountEntries(state)).toEqual([eth]);
    expect(selectAccountUUIDByLegacyId(state, ethId)).toBe(eth.accountUUID);
  });
});
