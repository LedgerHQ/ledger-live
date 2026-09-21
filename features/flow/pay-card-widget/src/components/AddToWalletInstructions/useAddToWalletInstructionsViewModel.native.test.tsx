import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";

jest.mock("./openWalletApp", () => ({ openWalletApp: jest.fn() }));

import { CARD_ONBOARDING_ADD_TO_WALLET_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { payCardOnboardingWidgetSlice, selectHasAddedCardToWallet } from "../../state";
import { openWalletApp } from "./openWalletApp";
import { useAddToWalletInstructionsViewModel } from "./useAddToWalletInstructionsViewModel";

function renderViewModel(onDone = jest.fn()) {
  const store = configureStore({
    reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
  });

  return {
    store,
    ...renderHook(() => useAddToWalletInstructionsViewModel({ onDone }), {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <I18nWrapper>{children}</I18nWrapper>
        </Provider>
      ),
    }),
  };
}

describe("useAddToWalletInstructionsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(openWalletApp).mockResolvedValue(true);
    Platform.OS = "ios";
  });

  it("resolves the iOS copy by default", () => {
    const { result } = renderViewModel();

    expect(result.current.title).toBe(CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.title);
    expect(result.current.steps).toEqual([
      CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.step1,
      CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.step2,
      CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.step3,
    ]);
    expect(result.current.ctaLabel).toBe(CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.cta);
  });

  it("resolves the Android copy on Android", () => {
    Platform.OS = "android";

    const { result } = renderViewModel();

    expect(result.current.title).toBe(CARD_ONBOARDING_ADD_TO_WALLET_COPY.android.title);
    expect(result.current.ctaLabel).toBe(CARD_ONBOARDING_ADD_TO_WALLET_COPY.android.cta);
  });

  it("dispatches and tells the host it is done once the wallet opened", async () => {
    const onDone = jest.fn();
    const { store, result } = renderViewModel(onDone);

    await result.current.onPressCta();

    expect(selectHasAddedCardToWallet(store.getState())).toBe(true);
    expect(openWalletApp).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("keeps the instructions on screen when the wallet could not be opened", async () => {
    jest.mocked(openWalletApp).mockResolvedValue(false);
    const onDone = jest.fn();
    const { store, result } = renderViewModel(onDone);

    await result.current.onPressCta();

    expect(selectHasAddedCardToWallet(store.getState())).toBe(false);
    expect(onDone).not.toHaveBeenCalled();
  });
});
