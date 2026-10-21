import React, { useState, type PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { cardManagementApi } from "@domain/api-card-management";
import { mockCardApiExtraArgument } from "@domain/api-card-management/mock/card-api";
import { payCardAuthSlice, type PayCardAuthState } from "@features/flow-pay-card-auth/state";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CATEGORY_LABELS = {
  SUBSCRIPTIONS: "Subscriptions",
  FOOD: "Food",
  TRAVEL: "Travel",
  ENTERTAINMENT: "Entertainment",
  HEALTH: "Health",
  ATM: "ATM",
  UTILITIES: "Utilities",
  MISC: "Other",
} as const;

export const SECTION_TITLE = "Transactions";

export const DETAIL_COPY = {
  amount: "Amount",
  status: "Status",
  card: "Card",
  cardInfo: "The last four digits of the card used for this payment.",
  fundingSource_one: "Funding source",
  fundingSource_other: "Funding sources",
  cashback: "Cashback",
  transactionId: "Transaction ID",
  copyTransactionId: "Copy transaction ID",
  today: "Today {{time}}",
  yesterday: "Yesterday {{time}}",
  dateTime: "{{date}} {{time}}",
  statusValues: {
    CONFIRMED: "Confirmed",
    PENDING: "Pending",
    DECLINED: "Declined",
    REVERTED: "Reverted",
  },
} as const;

const CARD_TRANSACTIONS_RESOURCES = {
  en: {
    translation: {
      payTab: {
        disclaimer: "Provided by Monavate Onchain",
        cardTransactions: {
          categories: CATEGORY_LABELS,
          title: SECTION_TITLE,
          detail: DETAIL_COPY,
          history: {
            today: "Today",
            yesterday: "Yesterday",
            unknownDate: "Date unavailable",
            columns: {
              transaction: "Transaction",
              cashback: "Cashback",
              fundingSources: "Funding sources",
              amount: "Amount",
            },
            paidWithAssets: "Paid with {{count}} assets",
            goToPay: "Go to Pay",
            signedOut: {
              title: "Log in to see your card transactions",
              description: "Your card activity appears here once you’re logged in.",
            },
            unclaimed: {
              title: "Crypto card",
              description: "Go to pay to set up your card.",
            },
            empty: {
              title: "No card transactions yet",
              description: "Come back later to see your card transactions.",
            },
            error: {
              title: "Couldn't load card transactions",
              description: "Check your connection and try again.",
            },
          },
        },
      },
    },
  },
};

function makeCardApiStore({ signedIn = false }: { signedIn?: boolean } = {}) {
  return configureStore({
    reducer: {
      [cardManagementApi.reducerPath]: cardManagementApi.reducer,
      payCardAuth: payCardAuthSlice.reducer,
    },
    preloadedState: {
      payCardAuth: {
        hasCard: signedIn,
        pendingLoginType: null,
        status: signedIn ? "signedIn" : "signedOut",
        isSessionResolving: false,
      } satisfies PayCardAuthState,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        thunk: { extraArgument: mockCardApiExtraArgument() },
      }).concat(cardManagementApi.middleware),
  });
}

function CardApiStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: ReturnType<typeof makeCardApiStore> }>) {
  return <Provider store={store}>{children}</Provider>;
}

export function cardApiWrapper({ signedIn = false }: { signedIn?: boolean } = {}) {
  return function CardApiWrapper({ children }: PropsWithChildren) {
    const [store] = useState(() => makeCardApiStore({ signedIn }));

    return (
      <CardApiStoreProvider store={store}>
        <I18nTestProvider resources={CARD_TRANSACTIONS_RESOURCES}>{children}</I18nTestProvider>
      </CardApiStoreProvider>
    );
  };
}
