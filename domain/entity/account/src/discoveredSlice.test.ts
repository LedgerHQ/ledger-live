import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  discoveredAccountsCleared,
  discoveredAccountsRegistered,
  discoveredAccountsSlice,
} from "./discoveredSlice";
import { AccountIdSchema } from "./legacy/schema";
import { DiscoveredAccountsStateSchema, initialDiscoveredAccountsState } from "./schema";
import { mockAccountEntry } from "./schema.mock";
import { legacyAccountsSynced, remoteAccountsAdded, remoteAccountsRemoved } from "./slice";

const { reducer } = discoveredAccountsSlice;
const { selectDiscoveredAccountDescriptor } = discoveredAccountsSlice.getSelectors();

const eth = mockAccountEntry({ legacyId: undefined });
const btc = mockAccountEntry({ legacyId: undefined, descriptor: mockUtxoAccountDescriptor() });
const found = [eth, btc].map(({ accountUUID, descriptor }) => ({ accountUUID, descriptor }));
const registered = reducer(undefined, discoveredAccountsRegistered(found));

describe("discoveredAccountsSlice", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "init" })).toEqual(initialDiscoveredAccountsState);
  });

  it("holds the descriptor of each account registered", () => {
    expect(DiscoveredAccountsStateSchema.parse(registered)).toEqual(registered);
    expect(selectDiscoveredAccountDescriptor(registered, eth.accountUUID)).toEqual(eth.descriptor);
    expect(selectDiscoveredAccountDescriptor(registered, btc.accountUUID)).toEqual(btc.descriptor);
  });

  it("forgets every account once cleared", () => {
    const cleared = reducer(registered, discoveredAccountsCleared());
    expect(cleared).toEqual(initialDiscoveredAccountsState);
    expect(selectDiscoveredAccountDescriptor(cleared, eth.accountUUID)).toBeUndefined();
  });

  it("drops an account once the accounts slice holds it, from either source", () => {
    const legacyEth = { ...eth, legacyId: AccountIdSchema.parse("js:2:ethereum:0x71:") };
    expect(reducer(registered, legacyAccountsSynced([legacyEth]))).toEqual({
      [btc.accountUUID]: btc.descriptor,
    });
    expect(reducer(registered, remoteAccountsAdded([btc]))).toEqual({
      [eth.accountUUID]: eth.descriptor,
    });
  });

  it("drops a removed account", () => {
    expect(reducer(registered, remoteAccountsRemoved([eth.accountUUID]))).toEqual({
      [btc.accountUUID]: btc.descriptor,
    });
  });
});
