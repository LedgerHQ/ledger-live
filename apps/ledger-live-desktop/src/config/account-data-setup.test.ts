import { configureStore } from "@reduxjs/toolkit";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { AccountIdSchema, accountsSlice } from "@domain/entity-account";
import reducers from "~/renderer/reducers";
import { removeAccount, replaceAccounts } from "~/renderer/actions/accounts";
import { connectAccounts } from "./account-data-setup";

const eth = genAccount("eth", { currency: getCryptoCurrencyById("ethereum") });
const polygon = genAccount("polygon", { currency: getCryptoCurrencyById("polygon") });

const { selectAccountEntries, selectAccountUUIDByLegacyId } = accountsSlice.getSelectors(
  (state: ReturnType<typeof reducers>) => state.accountEntries,
);

function setup() {
  const store = configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  });
  connectAccounts(store);
  return store;
}

describe("connectAccounts", () => {
  it("keeps one descriptor per legacy account through import and delete", () => {
    const store = setup();
    store.dispatch({ type: "INIT_ACCOUNTS", payload: { accounts: [eth], accountsUserData: [] } });
    expect(selectAccountUUIDByLegacyId(store.getState(), AccountIdSchema.parse(eth.id))).toBe(
      computeAccountUUID(fromLegacyAccount(eth)),
    );

    store.dispatch(replaceAccounts([eth, polygon]));
    expect(selectAccountEntries(store.getState())).toHaveLength(2);

    store.dispatch(removeAccount(eth));
    expect(
      selectAccountUUIDByLegacyId(store.getState(), AccountIdSchema.parse(eth.id)),
    ).toBeUndefined();
    expect(selectAccountUUIDByLegacyId(store.getState(), AccountIdSchema.parse(polygon.id))).toBe(
      computeAccountUUID(fromLegacyAccount(polygon)),
    );
  });
});
