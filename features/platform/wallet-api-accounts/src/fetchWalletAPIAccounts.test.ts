import BigNumber from "bignumber.js";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { sourceIdOf } from "@domain/api-account-data/testing";
import { accountDataSlice } from "@domain/entity-account-data";
import { accountsSlice, AccountIdSchema, legacyAccountsSynced } from "@domain/entity-account";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { mockAccountAssetBalance } from "@domain/entity-account-balance/schema.mock";
import { accountReceivesSlice } from "@domain/entity-account-receive";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import type { AccountNamesState } from "@domain/entity-account-name";
import { fetchWalletAPIAccountByLegacyId, fetchWalletAPIAccounts } from "./fetchWalletAPIAccounts";
import { walletApiIdOf } from "./walletApiAccountId";

const LEGACY_ID = AccountIdSchema.parse(
  "js:2:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:",
);
const descriptor = mockAddressAccountDescriptor();

const source: AccountDataSource = {
  id: sourceIdOf("fake"),
  supports: () => true,
  read: {
    balance: async () => [mockAccountAssetBalance({ assetId: "ethereum", balance: "42" })],
    receive: async () => mockAccountReceive({ address: "0xreceive" }),
  },
};

function makeStore(sources: AccountDataSource[] = [source]) {
  const store = configureStore({
    reducer: {
      accountData: accountDataSlice.reducer,
      accountBalances: accountBalancesSlice.reducer,
      accountReceives: accountReceivesSlice.reducer,
      accountEntries: accountsSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({
        thunk: { extraArgument: accountDataExtra(sources) },
        serializableCheck: false,
      }),
  });
  store.dispatch(
    legacyAccountsSynced([
      { legacyId: LEGACY_ID, descriptor, accountUUID: computeAccountUUID(descriptor) },
    ]),
  );
  return store;
}

const names: AccountNamesState = new Map([[LEGACY_ID, "Main"]]);

describe("fetchWalletAPIAccounts", () => {
  it("should read the balance and receive kinds, then build the accounts from the slices", async () => {
    const store = makeStore();
    const accounts = await store.dispatch(fetchWalletAPIAccounts(names));
    expect(accounts).toEqual([
      expect.objectContaining({
        id: walletApiIdOf(LEGACY_ID),
        name: "Main",
        address: "0xreceive",
        currency: "ethereum",
        balance: new BigNumber(42),
      }),
    ]);
  });

  it("should leave out an account whose balance could not be read, rather than list it empty", async () => {
    const failing: AccountDataSource = {
      ...source,
      read: { ...source.read, balance: async () => Promise.reject(new Error("offline")) },
    };
    const store = makeStore([failing]);
    expect(await store.dispatch(fetchWalletAPIAccounts(names))).toEqual([]);
  });

  it("should leave out the accounts the filter refuses", async () => {
    const store = makeStore();
    expect(await store.dispatch(fetchWalletAPIAccounts(names, () => false))).toEqual([]);
  });
});

describe("fetchWalletAPIAccountByLegacyId", () => {
  it("should build the account a legacy screen picked", async () => {
    const store = makeStore();
    const account = await store.dispatch(fetchWalletAPIAccountByLegacyId(names, LEGACY_ID));
    expect(account?.id).toBe(walletApiIdOf(LEGACY_ID));
  });

  it("should find nothing for an account the entities do not know", async () => {
    const store = makeStore();
    expect(
      await store.dispatch(fetchWalletAPIAccountByLegacyId(names, "js:2:ethereum:0xunknown:")),
    ).toBeUndefined();
  });
});
