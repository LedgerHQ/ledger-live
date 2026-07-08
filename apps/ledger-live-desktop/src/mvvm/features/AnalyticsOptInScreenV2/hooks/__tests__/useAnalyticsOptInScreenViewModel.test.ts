import { act, renderHook } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { EntryPoint } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import type { AnalyticsOptInScreenHostProps } from "../../types";
import { useAnalyticsOptInScreenViewModel } from "../useAnalyticsOptInScreenViewModel";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic", () => ({
  useAnalyticsOptInPrompt: jest.fn(() => ({
    shouldWeTrack: true,
  })),
}));

type SettingsState = typeof INITIAL_STATE;

const renderViewModel = (
  props: Omit<AnalyticsOptInScreenHostProps, "entryPoint"> &
    Partial<Pick<AnalyticsOptInScreenHostProps, "entryPoint">>,
) =>
  renderHook(
    () =>
      useAnalyticsOptInScreenViewModel({
        entryPoint: EntryPoint.onboarding,
        ...props,
      }),
    {
      initialState: {
        settings: INITIAL_STATE,
      },
    },
  );

describe("useAnalyticsOptInScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should apply accept all consent and close the screen", () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    const { result, store } = renderViewModel({
      isOpened: true,
      onClose,
      onSubmit,
    });

    act(() => {
      result.current.handleAcceptAll();
    });

    const settings = store.getState().settings as SettingsState;
    expect(settings.shareAnalytics).toBe(true);
    expect(settings.sharePersonalizedRecommandations).toBe(true);
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

    const { result, store } = renderViewModel({
      isOpened: true,
      onClose,
      onSubmit,
    });

    act(() => {
      result.current.handleRefuseAll();
    });

    const settings = store.getState().settings as SettingsState;
    expect(settings.shareAnalytics).toBe(false);
    expect(settings.sharePersonalizedRecommandations).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should open preferences step and confirm custom toggles", () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();

    const { result, store } = renderViewModel({
      isOpened: true,
      onClose,
      onSubmit,
    });

    act(() => {
      result.current.handleOpenPreferences();
    });
    expect(result.current.step).toBe("preferences");
    expect(result.current.isPreferencesDialogOpen).toBe(true);

    act(() => {
      result.current.setDraftShareAnalytics(true);
      result.current.setDraftSharePersonalized(false);
    });

    act(() => {
      result.current.applyPreferences();
    });

    const settings = store.getState().settings as SettingsState;
    expect(settings.shareAnalytics).toBe(true);
    expect(settings.sharePersonalizedRecommandations).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should close the screen when user goes back from main step", () => {
    const onClose = jest.fn();

    const { result } = renderViewModel({
      isOpened: true,
      onClose,
    });

    act(() => {
      result.current.handlePrevious();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "Previous",
        variant: "B",
      }),
      true,
    );
  });

  it("should return to main step when user goes back from preferences", () => {
    const onClose = jest.fn();

    const { result } = renderViewModel({
      isOpened: true,
      onClose,
    });

    act(() => {
      result.current.handleOpenPreferences();
    });
    expect(result.current.step).toBe("preferences");
    expect(result.current.isPreferencesDialogOpen).toBe(true);

    act(() => {
      result.current.handleBackFromPreferences();
    });
    expect(result.current.isPreferencesDialogOpen).toBe(false);
    expect(result.current.step).toBe("preferences");

    act(() => {
      result.current.handlePreferencesDialogClosed();
    });

    expect(result.current.step).toBe("main");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should open tracking policy from main step", () => {
    const { result } = renderViewModel({
      isOpened: true,
      onClose: jest.fn(),
    });

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
