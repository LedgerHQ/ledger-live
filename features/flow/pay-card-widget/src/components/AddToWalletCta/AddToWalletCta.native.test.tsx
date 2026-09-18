import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { Platform } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CARD_WALLET_PAY_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { payCardOnboardingWidgetSlice } from "../../state";
import { AddToWalletCtaWithBottomSheet } from "../AddToWalletCtaWithBottomSheet/AddToWalletCtaWithBottomSheet.native";
import { AddToWalletCta } from "./AddToWalletCta.native";

function renderCta(
  hasAddedCardToWallet: boolean,
  appearance?: "base" | "gray",
  onPress = jest.fn(),
) {
  return renderWithStore(
    <AddToWalletCta appearance={appearance} onPress={onPress} />,
    hasAddedCardToWallet,
  );
}

function renderCtaWithBottomSheet(hasAddedCardToWallet: boolean) {
  return renderWithStore(<AddToWalletCtaWithBottomSheet appearance="gray" />, hasAddedCardToWallet);
}

function renderWithStore(component: React.ReactElement, hasAddedCardToWallet: boolean) {
  const store = configureStore({
    reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
    preloadedState: {
      payCardOnboardingWidget: { hasCompletedOnboarding: false, hasAddedCardToWallet },
    },
  });

  return {
    store,
    ...render(component, {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <I18nWrapper>{children}</I18nWrapper>
        </Provider>
      ),
    }),
  };
}

describe("AddToWalletCta (native)", () => {
  afterEach(() => {
    Platform.OS = "ios";
  });

  it("labels the CTA with Apple Pay on iOS", () => {
    Platform.OS = "ios";
    renderCta(false);

    expect(screen.getByText(CARD_WALLET_PAY_COPY.Apple)).toBeVisible();
  });

  it("labels the CTA with Google Pay on Android", () => {
    Platform.OS = "android";
    renderCta(false);

    expect(screen.getByText(CARD_WALLET_PAY_COPY.Google)).toBeVisible();
  });

  it("still offers the CTA when a host page asks for the base appearance", () => {
    renderCta(false, "base");

    expect(screen.getByTestId("pay-card-add-to-wallet-cta-entry")).toBeVisible();
  });

  it("renders nothing once the card is already added to the wallet", () => {
    renderCta(true);

    expect(screen.queryByTestId("pay-card-add-to-wallet-cta-entry")).toBeNull();
  });

  it("opens the wallet sheet on press, and marking it done removes the CTA", async () => {
    const user = userEvent.setup();
    const { store } = renderCtaWithBottomSheet(false);

    expect(screen.getByTestId("pay-card-add-to-wallet-cta-entry")).toBeVisible();

    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta-entry"));
    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta"));

    expect(store.getState().payCardOnboardingWidget.hasAddedCardToWallet).toBe(true);
    expect(screen.queryByTestId("pay-card-add-to-wallet-cta-entry")).toBeNull();
  });

  it("calls the host when pressed", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    renderCta(false, "gray", onPress);

    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta-entry"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
