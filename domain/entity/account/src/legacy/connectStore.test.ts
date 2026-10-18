import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { connectAccountsStore } from "./connectStore";
import { AccountIdSchema } from "./schema";
import { initialAccountsState, type AccountsState } from "../schema";
import { accountsSlice } from "../slice";

type LegacyAccount = {
  id: string;
  descriptor?: AccountDescriptor;
  balance?: number;
};

const initialAccounts: LegacyAccount[] = [];

const legacy = createSlice({
  name: "accounts",
  initialState: initialAccounts,
  reducers: {
    replaceAccounts: (_, { payload }: PayloadAction<LegacyAccount[]>) => payload,
  },
});
const { replaceAccounts } = legacy.actions;

const {
  selectAccountEntries,
  selectAccountEntry,
  selectAccountUUIDByLegacyId,
  selectAccountUUIDs,
} = accountsSlice.getSelectors((state: { accountEntries: AccountsState }) => state.accountEntries);

const eth = mockAddressAccountDescriptor();
const btc = mockUtxoAccountDescriptor();
const ethAccount: LegacyAccount = { id: "js:2:ethereum:0x71:", descriptor: eth };
const btcAccount: LegacyAccount = {
  id: "js:2:bitcoin:xpub:native_segwit",
  descriptor: btc,
};

function setup(accounts: LegacyAccount[] = []) {
  const store = configureStore({
    reducer: { accounts: legacy.reducer, accountEntries: accountsSlice.reducer },
    preloadedState: { accounts, accountEntries: initialAccountsState },
  });
  const toDescriptor = jest.fn((account: LegacyAccount) => {
    if (!account.descriptor) throw new Error("unsupported");
    return account.descriptor;
  });
  const onError = jest.fn();
  const disconnect = connectAccountsStore(store, {
    selectLegacyAccounts: state => state.accounts,
    toDescriptor,
    onError,
  });
  return { store, toDescriptor, onError, disconnect };
}

describe("connectAccountsStore", () => {
  it("mirrors the accounts already in the store", () => {
    const { store } = setup([ethAccount]);
    expect(selectAccountEntry(store.getState(), computeAccountUUID(eth))).toEqual({
      accountUUID: computeAccountUUID(eth),
      descriptor: eth,
      legacyId: AccountIdSchema.parse(ethAccount.id),
    });
  });

  it("follows the accounts added and removed", () => {
    const { store } = setup([ethAccount]);
    store.dispatch(replaceAccounts([ethAccount, btcAccount]));
    expect(
      selectAccountUUIDByLegacyId(store.getState(), AccountIdSchema.parse(btcAccount.id)),
    ).toBe(computeAccountUUID(btc));
    store.dispatch(replaceAccounts([btcAccount]));
    expect(
      selectAccountUUIDByLegacyId(store.getState(), AccountIdSchema.parse(ethAccount.id)),
    ).toBeUndefined();
    expect(selectAccountUUIDs(store.getState())).toEqual([computeAccountUUID(btc)]);
  });

  it("ignores an update that keeps the accounts and their order", () => {
    const { store } = setup([ethAccount, btcAccount]);
    const before = store.getState().accountEntries;
    store.dispatch(replaceAccounts([{ ...ethAccount, balance: 1 }, btcAccount]));
    expect(store.getState().accountEntries).toBe(before);
  });

  it("follows a reorder, and converts each account once", () => {
    const { store, toDescriptor } = setup([ethAccount, btcAccount]);
    store.dispatch(replaceAccounts([btcAccount, ethAccount]));
    expect(selectAccountUUIDs(store.getState())).toEqual([
      computeAccountUUID(btc),
      computeAccountUUID(eth),
    ]);
    store.dispatch(replaceAccounts([btcAccount]));
    expect(toDescriptor).toHaveBeenCalledTimes(2);
  });

  it("does not convert an account again when it changes", () => {
    const { store, toDescriptor } = setup([ethAccount]);
    store.dispatch(replaceAccounts([{ ...ethAccount, balance: 1 }, btcAccount]));
    store.dispatch(replaceAccounts([{ ...ethAccount, balance: 2 }, btcAccount]));
    expect(toDescriptor).toHaveBeenCalledTimes(2);
  });

  it("does not sync again on an update of a list holding the same id twice", () => {
    const { store } = setup([ethAccount, ethAccount]);
    const before = store.getState().accountEntries;
    store.dispatch(replaceAccounts([ethAccount, { ...ethAccount, balance: 1 }]));
    expect(store.getState().accountEntries).toBe(before);
  });

  it("leaves out an account no descriptor expresses, and reports it once", () => {
    const unsupported = { id: "js:2:unknown:x:" };
    const { store, onError } = setup([unsupported, ethAccount]);
    store.dispatch(replaceAccounts([unsupported, ethAccount, btcAccount]));
    expect(selectAccountEntries(store.getState())).toHaveLength(2);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), unsupported);
  });

  it("leaves out a token account id", () => {
    const { store, onError } = setup([{ ...ethAccount, id: "js:2:ethereum:0x71:+usdc" }]);
    expect(selectAccountEntries(store.getState())).toEqual([]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("drops the stale entries when it connects to an empty list", () => {
    const { store, disconnect } = setup([ethAccount]);
    disconnect();
    store.dispatch(replaceAccounts([]));
    connectAccountsStore(store, {
      selectLegacyAccounts: state => state.accounts,
      toDescriptor: account => mockAddressAccountDescriptor({ address: account.id }),
    });
    expect(selectAccountEntries(store.getState())).toEqual([]);
  });

  it("stops mirroring once disconnected", () => {
    const { store, disconnect } = setup();
    disconnect();
    store.dispatch(replaceAccounts([ethAccount]));
    expect(selectAccountEntries(store.getState())).toEqual([]);
  });
});
