import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { useAnalyticsOptInScreenV2ViewModel } from "../useAnalyticsOptInScreenV2ViewModel";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic", () => ({
  useAnalyticsOptInPrompt: jest.fn(() => ({
    shouldWeTrack: true,
  })),
}));

describe("useAnalyticsOptInScreenV2ViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should apply accept all consent and close the screen", () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    const { result, store } = renderHook(
      () =>
        useAnalyticsOptInScreenV2ViewModel({
          isOpened: true,
          onClose,
          onSubmit,
        }),
      {},
    );

    act(() => {
      result.current.handleAcceptAll();
    });

    expect(store.getState().settings.shareAnalytics).toBe(true);
    expect(store.getState().settings.sharePersonalizedRecommandations).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Accept all",
        variant: "B",
        flow: "consent onboarding",
        entryPoint: "Onboarding",
      }),
      true,
    );
  });

  it("should apply refuse all consent and close the screen", () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    const { result, store } = renderHook(
      () =>
        useAnalyticsOptInScreenV2ViewModel({
          isOpened: true,
          onClose,
          onSubmit,
        }),
      {},
    );

    act(() => {
      result.current.handleRefuseAll();
    });

    expect(store.getState().settings.shareAnalytics).toBe(false);
    expect(store.getState().settings.sharePersonalizedRecommandations).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should open preferences step and confirm custom toggles", () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    const { result, store } = renderHook(
      () =>
        useAnalyticsOptInScreenV2ViewModel({
          isOpened: true,
          onClose,
          onSubmit,
        }),
      {},
    );

    act(() => {
      result.current.handleOpenPreferences();
    });
    expect(result.current.step).toBe("preferences");

    act(() => {
      result.current.setDraftShareAnalytics(true);
      result.current.setDraftSharePersonalized(false);
    });

    act(() => {
      result.current.applyPreferences();
    });

    expect(store.getState().settings.shareAnalytics).toBe(true);
    expect(store.getState().settings.sharePersonalizedRecommandations).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should open tracking policy from main step", () => {
    const { result } = renderHook(
      () =>
        useAnalyticsOptInScreenV2ViewModel({
          isOpened: true,
          onClose: jest.fn(),
        }),
      {},
    );

    act(() => {
      result.current.handleOpenTrackingPolicy();
    });

    expect(openURL).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Learn more link",
        variant: "B",
      }),
      true,
    );
  });
});
