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

const CARD_TRANSACTIONS_RESOURCES = {
  en: {
    translation: {
      payTab: {
        cardTransactions: { categories: CATEGORY_LABELS },
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
