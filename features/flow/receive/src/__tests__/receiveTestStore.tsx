import React, { type ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { accountsSlice, remoteAccountsAdded } from "@domain/entity-account";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { accountReceivesSlice } from "@domain/entity-account-receive";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { accountStatusSlice } from "@domain/entity-account-status";
import { receiveVerifyHintSlice } from "../state";
import { mockAccountStatus, mockAssetStatus } from "@domain/entity-account-status/schema.mock";
import { calApiExtra } from "@shared/api-services";
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
      receiveVerifyHint: receiveVerifyHintSlice.reducer,
      [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
    },
    middleware: getDefault =>
      getDefault({
        thunk: {
          extraArgument: {
            ...accountDataExtra([source]),
            ...calApiExtra({ calServiceUrl: "https://cal.test", ledgerClientVersion: "test" }),
          },
        },
      }).concat(cryptoAssetsApi.middleware),
  });
  store.dispatch(
    remoteAccountsAdded([{ accountUUID: testAccountUUID, descriptor: testDescriptor }]),
  );
  return store;
}

/** The English wording the receive tests read, as in the apps' catalogs. */
const receiveTestResources = {
  en: {
    translation: {
      receiveAddress: {
        title: "Receive {{asset}}",
        networkLabel: "{{network}} network",
        close: "Close",
        back: "Back",
        error: {
          title: "We couldn't load this address",
          description: "Check your internet connection, then try again.",
          retry: "Retry",
        },
        selectAddress: { title: "Select address" },
        addressOptions: { transparent: "Public address", shielded: "Private address" },
        actions: { copy: "Copy", copied: "Copied", share: "Share", verify: "Verify" },
        notices: {
          utxo: "For privacy reasons, a new address is generated after each transaction. The previous ones remain valid.",
          taproot: "Make sure the sender supports Taproot addresses before sending.",
          dashStaking: "Don't use this address to receive staking rewards.",
          tronInactiveAccount: "Send at least 0.1 TRX to this address first to activate it.",
          tezosDelegation: "Funds received won't be delegated until the next delegation cycle.",
          zcashPrivateNotEnabled:
            "Private (shielded) receiving isn't enabled on this account yet. Enable it from the account page to get a private address.",
          unverifiableAddress:
            "Your Ledger device can't display this address. Check it on the explorer before sharing it.",
          learnMore: "Learn more",
        },
        serviceStatus: { cta: "See details", title: "Service incident" },
        gotIt: "Got it",
        memoTag: {
          title: "Need a Tag/Memo?",
          description:
            "You might need a Tag/Memo for receiving this asset from an exchange. You can use any combination of numbers like 1234.",
        },
        help: {
          cardTitle: "Need support? Get help",
          title: "Get help",
          receiveFromExchange: "How to receive from exchanges?",
          receiveSecurely: "How to receive securely?",
        },
        verifyHint: {
          message: "Verify your address on your Ledger device before sharing",
          gotIt: "Got it",
        },
      },
    },
  },
};

/** The test store and the receive wording, as a `render` wrapper. */
export function receiveTestWrapper(store = makeReceiveTestStore()) {
  return function ReceiveTestWrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <I18nTestProvider resources={receiveTestResources}>{children}</I18nTestProvider>
      </Provider>
    );
  };
}
