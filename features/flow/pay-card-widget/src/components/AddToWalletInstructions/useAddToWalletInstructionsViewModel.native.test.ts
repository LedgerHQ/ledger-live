import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";

jest.mock("react-redux", () => ({ useDispatch: jest.fn() }));
jest.mock("./openWalletApp", () => ({ openWalletApp: jest.fn(() => Promise.resolve()) }));

import { useDispatch } from "react-redux";
import { CARD_ONBOARDING_ADD_TO_WALLET_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { openWalletApp } from "./openWalletApp";
import { useAddToWalletInstructionsViewModel } from "./useAddToWalletInstructionsViewModel";

const dispatch = jest.fn();

function renderViewModel(onDone = jest.fn()) {
  return renderHook(() => useAddToWalletInstructionsViewModel({ onDone }), {
    wrapper: I18nWrapper,
  });
}

describe("useAddToWalletInstructionsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useDispatch).mockReturnValue(dispatch);
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

  it("dispatches, tells the host it is done, and opens the wallet when the CTA is pressed", () => {
    const onDone = jest.fn();
    const { result } = renderViewModel(onDone);

    result.current.onPressCta();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(openWalletApp).toHaveBeenCalledTimes(1);
  });
});
