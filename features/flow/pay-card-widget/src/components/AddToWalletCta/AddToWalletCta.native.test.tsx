import React from "react";
import { Platform } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";

jest.mock("../AddToWalletInstructions/openWalletApp", () => ({
  openGoogleWalletStore: jest.fn(),
  openWalletApp: jest.fn(),
}));

jest.mock("@domain/api-card-management", () => ({ useGetCardStatusQuery: jest.fn() }));

import { useGetCardStatusQuery } from "@domain/api-card-management";
import { CARD_WALLET_PAY_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { AddToWalletCtaWithBottomSheet } from "../AddToWalletCtaWithBottomSheet/AddToWalletCtaWithBottomSheet.native";
import { openWalletApp } from "../AddToWalletInstructions/openWalletApp";
import { AddToWalletCta } from "./AddToWalletCta.native";

const refetchCardStatus = jest.fn();

/** `undefined` is a tenant that does not answer for the flag, which still offers the CTA. */
function setCardAddedToDigitalWallet(cardAddedToDigitalWallet?: boolean) {
  jest.mocked(useGetCardStatusQuery).mockReturnValue({
    refetch: refetchCardStatus,
    data: cardAddedToDigitalWallet === undefined ? undefined : { cardAddedToDigitalWallet },
  } as unknown as ReturnType<typeof useGetCardStatusQuery>);
}

function renderIn(component: React.ReactElement) {
  return render(component, { wrapper: ({ children }) => <I18nWrapper>{children}</I18nWrapper> });
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

  it("opens the wallet sheet on press, and re-asks the provider once the wallet opened", async () => {
    const user = userEvent.setup();
    renderIn(<AddToWalletCtaWithBottomSheet appearance="gray" />);

    expect(screen.getByTestId("pay-card-add-to-wallet-cta-entry")).toBeVisible();

    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta-entry"));
    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta"));

    // Nothing local records the answer now, so the CTA stays until the provider reports it.
    expect(refetchCardStatus).toHaveBeenCalledTimes(1);
  });

  it("calls the host when pressed", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    renderCta("gray", onPress);

    await user.press(screen.getByTestId("pay-card-add-to-wallet-cta-entry"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
