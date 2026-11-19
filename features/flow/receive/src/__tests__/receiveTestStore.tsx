import React, { type ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { accountsSlice, remoteAccountsAdded } from "@domain/entity-account";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { accountReceivesSlice } from "@domain/entity-account-receive";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { accountStatusSlice } from "@domain/entity-account-status";
import { mockAccountStatus, mockAssetStatus } from "@domain/entity-account-status/schema.mock";
import { I18nTestProvider } from "@shared/i18n/testing";

export const testDescriptor = mockAddressAccountDescriptor();
export const testAccountUUID = computeAccountUUID(testDescriptor);
export const testReceive = mockAccountReceive();

type ReceiveReads = Pick<
  Required<NonNullable<AccountDataSource["read"]>>,
  "receive" | "accountStatus" | "assetStatus"
>;

/**
 * A store holding the account data the receive screens read, for the mock address account, with a
 * source answering `reads`: the mock receive, a used account and no asset gate by default.
 */
export function makeReceiveTestStore(reads: Partial<ReceiveReads> = {}) {
  const source: AccountDataSource = {
    id: AccountDataSourceIdSchema.parse("test"),
    supports: () => true,
    read: {
      receive: async () => testReceive,
      accountStatus: async () => mockAccountStatus(),
      assetStatus: async (_target, query) => ({
        assetId: query!.assetId,
        status: mockAssetStatus(),
      }),
      ...reads,
    },
  };
  const store = configureStore({
    reducer: {
      accountData: accountDataSlice.reducer,
      accountEntries: accountsSlice.reducer,
      accountReceives: accountReceivesSlice.reducer,
      accountStatus: accountStatusSlice.reducer,
    },
    middleware: getDefault => getDefault({ thunk: { extraArgument: accountDataExtra([source]) } }),
  });
  store.dispatch(
    remoteAccountsAdded([{ accountUUID: testAccountUUID, descriptor: testDescriptor }]),
  );
  return store;
}

/** The test store and the i18n catalog, as a `render` wrapper. */
export function receiveTestWrapper(store = makeReceiveTestStore()) {
  return function ReceiveTestWrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <I18nTestProvider>{children}</I18nTestProvider>
      </Provider>
    );
  };
}
