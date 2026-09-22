import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";

jest.mock("./openWalletApp", () => ({
  openGoogleWalletStore: jest.fn(),
  openWalletApp: jest.fn(),
}));

jest.mock("@domain/api-card-management", () => ({ useGetCardStatusQuery: jest.fn() }));

import { useGetCardStatusQuery } from "@domain/api-card-management";
import { CARD_ONBOARDING_ADD_TO_WALLET_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { openGoogleWalletStore, openWalletApp } from "./openWalletApp";
import {
  type AddToWalletInstructionsViewProps,
  useAddToWalletInstructionsViewModel,
} from "./useAddToWalletInstructionsViewModel";

const refetchCardStatus = jest.fn();

function renderViewModel(onDone = jest.fn()) {
  return renderHook(() => useAddToWalletInstructionsViewModel({ onDone }), {
    wrapper: ({ children }) => <I18nWrapper>{children}</I18nWrapper>,
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
    jest.mocked(useGetCardStatusQuery).mockReturnValue({
      refetch: refetchCardStatus,
      data: undefined,
    } as unknown as ReturnType<typeof useGetCardStatusQuery>);
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

  it("re-asks the provider and tells the host it is done once the wallet opened", async () => {
    const onDone = jest.fn();
    const { result } = renderViewModel(onDone);

    await act(getScene(result.current, "instructions").onPressCta);

    expect(refetchCardStatus).toHaveBeenCalledTimes(1);
    expect(openWalletApp).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("shows the iOS error scene when Apple Wallet could not be opened", async () => {
    jest.mocked(openWalletApp).mockResolvedValue(false);
    const onDone = jest.fn();
    const { result } = renderViewModel(onDone);

    await act(getScene(result.current, "instructions").onPressCta);

    expect(refetchCardStatus).not.toHaveBeenCalled();
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

    expect(openWalletApp).toHaveBeenCalledTimes(2);
    expect(refetchCardStatus).toHaveBeenCalledTimes(1);
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
    expect(refetchCardStatus).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();

    act(getScene(result.current, "error").onBack);
    getScene(result.current, "instructions");
  });
});
