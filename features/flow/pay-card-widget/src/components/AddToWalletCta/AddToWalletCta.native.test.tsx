import React from "react";
import { Platform } from "react-native";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render, screen, userEvent } from "@testing-library/react-native";
import { PayAnalyticsProvider } from "@features/platform-pay-analytics";

jest.mock("../AddToWalletInstructions/openWalletApp", () => ({
  openGoogleWalletStore: jest.fn(),
  openWalletApp: jest.fn(),
}));

jest.mock("@domain/api-card-management", () => ({ useGetCardStatusQuery: jest.fn() }));

import { useGetCardStatusQuery } from "@domain/api-card-management";
import { CARD_WALLET_PAY_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import {
  payCardOnboardingWidgetSlice,
  selectDigitalWalletProvisioningStartedAt,
} from "../../state";
import { AddToWalletCtaWithBottomSheet } from "../AddToWalletCtaWithBottomSheet/AddToWalletCtaWithBottomSheet.native";
import { openWalletApp } from "../AddToWalletInstructions/openWalletApp";
import { AddToWalletCta } from "./AddToWalletCta.native";

/** `undefined` is a tenant that does not answer for the flag, which still offers the CTA. */
function setCardAddedToDigitalWallet(cardAddedToDigitalWallet?: boolean) {
  jest.mocked(useGetCardStatusQuery).mockReturnValue({
    refetch: jest.fn(),
    data: cardAddedToDigitalWallet === undefined ? undefined : { cardAddedToDigitalWallet },
  } as unknown as ReturnType<typeof useGetCardStatusQuery>);
}

function renderIn(component: React.ReactElement) {
  const store = configureStore({
    reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
  });

  return {
    ...render(component, {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <PayAnalyticsProvider adapter={{ track: jest.fn() }}>
            <I18nWrapper>{children}</I18nWrapper>
          </PayAnalyticsProvider>
        </Provider>
      ),
    }),
    store,
  };
}

function renderCta(appearance?: "base" | "gray", onPress = jest.fn()) {
  return renderIn(<AddToWalletCta appearance={appearance} onPress={onPress} />);
}

describe("AddToWalletCta (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setCardAddedToDigitalWallet(undefined);
    jest.mocked(openWalletApp).mockResolvedValue(true);
  });

  afterEach(() => {
    Platform.OS = "ios";
  });

  it("labels the CTA with Apple Pay on iOS", () => {
    Platform.OS = "ios";
    renderCta();

    expect(screen.getByText(CARD_WALLET_PAY_COPY.Apple)).toBeVisible();
  });

  it("labels the CTA with Google Pay on Android", () => {
    Platform.OS = "android";
    renderCta();

    expect(screen.getByText(CARD_WALLET_PAY_COPY.Google)).toBeVisible();
  });

  it("still offers the CTA when a host page asks for the base appearance", () => {
    renderCta("base");

    expect(screen.getByTestId("pay-card-add-to-wallet-cta-entry")).toBeVisible();
  });

  it("renders nothing once the provider answers that the card is in the wallet", () => {
    setCardAddedToDigitalWallet(true);
    renderCta();

    expect(screen.queryByTestId("pay-card-add-to-wallet-cta-entry")).toBeNull();
  });

  it("keeps offering the CTA while the provider answers no", () => {
    setCardAddedToDigitalWallet(false);
    renderCta();

    expect(screen.getByTestId("pay-card-add-to-wallet-cta-entry")).toBeVisible();
  });

  it("opens the wallet from the sheet without marking anything pending yet", async () => {
    const user = userEvent.setup();
    const { store } = renderIn(<AddToWalletCtaWithBottomSheet appearance="gray" />);

    expect(screen.getByTestId("pay-card-add-to-wallet-cta-entry")).toBeVisible();

    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta-entry"));
    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta"));

    expect(openWalletApp).toHaveBeenCalledTimes(1);
    expect(selectDigitalWalletProvisioningStartedAt(store.getState())).toBeNull();
  });

  it("calls the host when pressed", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    renderCta("gray", onPress);

    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta-entry"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
