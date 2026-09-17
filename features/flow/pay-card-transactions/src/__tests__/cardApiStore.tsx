import React, { type PropsWithChildren } from "react";
import {
  CARD_API_BASE_URL,
  cardApiWrapper as storeWrapper,
} from "@support/msw-features-flow-pay-card";
import { I18nTestProvider } from "@shared/i18n/testing";

export const CARD_TRANSACTIONS_URL = `${CARD_API_BASE_URL}/v1/card/transactions`;

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
  fundingSource: "Funding source",
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
              fundingSources: "Funding sources",
              amount: "Amount",
            },
            paidWithAssets: "Paid with {{count}} assets",
            goToPay: "Go to Pay",
            signedOut: {
              title: "Log in to see your card transactions",
              description: "Your card activity appears here once you’re logged in.",
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

export function cardApiWrapper({ signedIn = false }: { signedIn?: boolean } = {}) {
  const StoreWrapper = storeWrapper({ signedIn });

  return function CardApiWrapper({ children }: PropsWithChildren) {
    return (
      <StoreWrapper>
        <I18nTestProvider resources={CARD_TRANSACTIONS_RESOURCES}>{children}</I18nTestProvider>
      </StoreWrapper>
    );
  };
}
