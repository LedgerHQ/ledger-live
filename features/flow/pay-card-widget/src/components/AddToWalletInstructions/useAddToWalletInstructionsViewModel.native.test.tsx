import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import {
  AppState,
  type AppStateStatus,
  type NativeEventSubscription,
  Platform,
} from "react-native";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

jest.mock("./openWalletApp", () => ({
  openGoogleWalletStore: jest.fn(),
  openWalletApp: jest.fn(),
}));

import { CARD_ONBOARDING_ADD_TO_WALLET_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import {
  payCardOnboardingWidgetSlice,
  selectDigitalWalletProvisioningStartedAt,
} from "../../state";
import { openGoogleWalletStore, openWalletApp } from "./openWalletApp";
import {
  type AddToWalletInstructionsViewProps,
  useAddToWalletInstructionsViewModel,
} from "./useAddToWalletInstructionsViewModel";

const removeAppStateListener = jest.fn();
let appStateListener: ((state: AppStateStatus) => void) | undefined;
let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
  });
}

function provisioningStartedAt() {
  return selectDigitalWalletProvisioningStartedAt(store.getState());
}

function renderViewModel(onDone = jest.fn()) {
  return renderHook(() => useAddToWalletInstructionsViewModel({ onDone }), {
    wrapper: ({ children }) => (
      <Provider store={store}>
        <I18nWrapper>{children}</I18nWrapper>
      </Provider>
    ),
  });
}

function getScene<TScene extends AddToWalletInstructionsViewProps["scene"]>(
  current: AddToWalletInstructionsViewProps,
  scene: TScene,
): Extract<AddToWalletInstructionsViewProps, { scene: TScene }> {
  if (current.scene !== scene) throw new Error(`Expected ${scene} scene`);
  return current as Extract<AddToWalletInstructionsViewProps, { scene: TScene }>;
}

describe("useAddToWalletInstructionsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store = makeStore();
    appStateListener = undefined;
    jest.mocked(AppState.addEventListener).mockImplementation((_type, listener) => {
      appStateListener = listener;
      return { remove: removeAppStateListener } as NativeEventSubscription;
    });
    jest.mocked(openWalletApp).mockResolvedValue(true);
    jest.mocked(openGoogleWalletStore).mockResolvedValue(true);
    Platform.OS = "ios";
  });

  it("resolves the iOS copy by default", () => {
    const { result } = renderViewModel();

    const instructions = getScene(result.current, "instructions");

    expect(instructions.title).toBe(CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.title);
    expect(instructions.steps).toEqual([
      CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.step1,
      CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.step2,
      CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.step3,
    ]);
    expect(instructions.ctaLabel).toBe(CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.cta);
  });

  it("resolves the Android copy on Android", () => {
    Platform.OS = "android";

    const { result } = renderViewModel();

    const instructions = getScene(result.current, "instructions");

    expect(instructions.title).toBe(CARD_ONBOARDING_ADD_TO_WALLET_COPY.android.title);
    expect(instructions.ctaLabel).toBe(CARD_ONBOARDING_ADD_TO_WALLET_COPY.android.cta);
  });

  it("marks the wallet provisioning pending only once the holder is back from the wallet", async () => {
    const onDone = jest.fn();
    const { result } = renderViewModel(onDone);

    await act(getScene(result.current, "instructions").onPressCta);

    expect(openWalletApp).toHaveBeenCalledTimes(1);
    expect(provisioningStartedAt()).toBeNull();
    expect(onDone).not.toHaveBeenCalled();

    act(() => appStateListener?.("background"));
    act(() => appStateListener?.("active"));

    expect(provisioningStartedAt()).toEqual(expect.any(Number));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("listens for the app return only once the wallet has opened", async () => {
    const { result } = renderViewModel();

    expect(AppState.addEventListener).not.toHaveBeenCalled();

    await act(getScene(result.current, "instructions").onPressCta);

    expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
  });

  it("stops listening once the holder is back", async () => {
    const { result } = renderViewModel();

    await act(getScene(result.current, "instructions").onPressCta);
    act(() => appStateListener?.("background"));
    act(() => appStateListener?.("active"));

    expect(removeAppStateListener).toHaveBeenCalledTimes(1);
  });

  it("does not mark the provisioning pending on an active event unless the app first left", async () => {
    const onDone = jest.fn();
    const { result } = renderViewModel(onDone);

    await act(getScene(result.current, "instructions").onPressCta);
    act(() => appStateListener?.("active"));

    expect(provisioningStartedAt()).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("shows the iOS error scene when Apple Wallet could not be opened", async () => {
    jest.mocked(openWalletApp).mockResolvedValue(false);
    const onDone = jest.fn();
    const { result } = renderViewModel(onDone);

    await act(getScene(result.current, "instructions").onPressCta);

    expect(AppState.addEventListener).not.toHaveBeenCalled();
    expect(provisioningStartedAt()).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
    expect(getScene(result.current, "error").title).toBe(
      CARD_ONBOARDING_ADD_TO_WALLET_COPY.ios.error.title,
    );
  });

  it("retries Apple Wallet from the iOS error scene", async () => {
    jest.mocked(openWalletApp).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const onDone = jest.fn();
    const { result } = renderViewModel(onDone);

    await act(getScene(result.current, "instructions").onPressCta);
    await act(getScene(result.current, "error").onPressAction);
    act(() => appStateListener?.("background"));
    act(() => appStateListener?.("active"));

    expect(openWalletApp).toHaveBeenCalledTimes(2);
    expect(provisioningStartedAt()).toEqual(expect.any(Number));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("opens Google Play from the Android error scene", async () => {
    Platform.OS = "android";
    jest.mocked(openWalletApp).mockResolvedValue(false);
    const onDone = jest.fn();
    const { result } = renderViewModel(onDone);

    await act(getScene(result.current, "instructions").onPressCta);
    await act(getScene(result.current, "error").onPressAction);

    expect(openGoogleWalletStore).toHaveBeenCalledTimes(1);
    expect(provisioningStartedAt()).toBeNull();
    expect(onDone).not.toHaveBeenCalled();

    act(getScene(result.current, "error").onBack);
    getScene(result.current, "instructions");
  });
});
