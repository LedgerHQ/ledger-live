import React, { type PropsWithChildren } from "react";
import { cardApiWrapper as storeWrapper } from "@support/msw-features-flow-pay-card";
import { PayAnalyticsProvider } from "@features/platform-pay-analytics";
import { I18nTestProvider } from "@shared/i18n/testing";
import { CARD_RESOURCES } from "./i18nWrapper";

const noop = () => {};

export function cardApiWrapper({
  signedIn = false,
  track = noop,
}: {
  signedIn?: boolean;
  track?: (event: string, properties?: Record<string, unknown>) => void;
} = {}) {
  const StoreWrapper = storeWrapper({ signedIn });

  return function CardApiWrapper({ children }: PropsWithChildren) {
    return (
      <StoreWrapper>
        <PayAnalyticsProvider adapter={{ track }}>
          <I18nTestProvider resources={CARD_RESOURCES}>{children}</I18nTestProvider>
        </PayAnalyticsProvider>
      </StoreWrapper>
    );
  };
}
