import React, { type PropsWithChildren } from "react";
import { cardApiWrapper as storeWrapper } from "@support/msw-features-flow-pay-card";
import { I18nTestProvider } from "@shared/i18n/testing";
import { CARD_RESOURCES } from "./i18nWrapper";

export function cardApiWrapper({ signedIn = false }: { signedIn?: boolean } = {}) {
  const StoreWrapper = storeWrapper({ signedIn });

  return function CardApiWrapper({ children }: PropsWithChildren) {
    return (
      <StoreWrapper>
        <I18nTestProvider resources={CARD_RESOURCES}>{children}</I18nTestProvider>
      </StoreWrapper>
    );
  };
}
