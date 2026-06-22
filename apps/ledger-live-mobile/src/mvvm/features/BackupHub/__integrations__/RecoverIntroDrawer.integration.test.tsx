import React from "react";
import { Linking } from "react-native";
import { act, fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { screen as analyticsScreen, track } from "~/analytics";
import type { State } from "~/reducers/types";
import {
  openBackupHubFeatureIntro,
  tickBackupHubFeatureIntroDeeplink,
} from "~/reducers/backupHubFeatureIntro";
import { handleBackupHubDeeplink } from "~/navigation/deeplinks/handleBackupHubDeeplink";
import { RecoverIntroDrawer } from "../components/RecoverIntroDrawer";
import { BACKUP_HUB_FEATURE_INTRO_PAGE, BACKUP_HUB_FEATURE_INTRO_SOURCE } from "../analytics";

jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useCustomURI: jest.fn(
    (_, redirectTo: string) => `ledgerlive://recover/protect-prod?redirectTo=${redirectTo}`,
  ),
}));

describe("RecoverIntroDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  const withBackupHubFeatureIntro =
    (backupHubFeatureIntro: Partial<State["backupHubFeatureIntro"]>) =>
    (state: State): State => ({
      ...state,
      backupHubFeatureIntro: {
        ...state.backupHubFeatureIntro,
        ...backupHubFeatureIntro,
      },
    });

  const renderFeatureIntro = (
    backupHubFeatureIntro: Partial<State["backupHubFeatureIntro"]> = { isOpen: true },
  ) =>
    render(<RecoverIntroDrawer />, {
      overrideInitialState: withFlagOverrides(
        {
          lwmBackupHub: { enabled: true },
          protectServicesMobile: { enabled: true, params: { protectId: "protect-prod" } },
        },
        withBackupHubFeatureIntro(backupHubFeatureIntro),
      ),
    });

  it("should render the feature intro bottom-sheet when open", async () => {
    renderFeatureIntro();

    act(() => jest.runOnlyPendingTimers());

    expect(await screen.findByText("Create a backup you can't lose")).toBeOnTheScreen();
    expect(analyticsScreen).toHaveBeenCalledWith(BACKUP_HUB_FEATURE_INTRO_PAGE, undefined, {
      name: BACKUP_HUB_FEATURE_INTRO_PAGE,
      source: BACKUP_HUB_FEATURE_INTRO_SOURCE,
    });
  });

  it("should open Recover resume activate when primary CTA is pressed", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { user } = renderFeatureIntro();

    act(() => jest.runOnlyPendingTimers());

    await user.press(await screen.findByText("Try 1 month free"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Try 1 month free",
      page: BACKUP_HUB_FEATURE_INTRO_PAGE,
      source: BACKUP_HUB_FEATURE_INTRO_SOURCE,
      link: "ledgerlive://recover/protect-prod?redirectTo=resumeActivate",
    });
    expect(openURL).toHaveBeenCalledWith(
      "ledgerlive://recover/protect-prod?redirectTo=resumeActivate",
    );
    expect(track).not.toHaveBeenCalledWith("modal_dismissed", expect.anything());
  });

  it("should open Recover login when secondary CTA is pressed", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { user } = renderFeatureIntro();

    act(() => jest.runOnlyPendingTimers());

    await user.press(await screen.findByText("Log in"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Log in",
      page: BACKUP_HUB_FEATURE_INTRO_PAGE,
      source: BACKUP_HUB_FEATURE_INTRO_SOURCE,
      link: "ledgerlive://recover/protect-prod?redirectTo=login",
    });
    expect(openURL).toHaveBeenCalledWith("ledgerlive://recover/protect-prod?redirectTo=login");
    expect(track).not.toHaveBeenCalledWith("modal_dismissed", expect.anything());
  });

  it("should dismiss the bottom-sheet when closed", async () => {
    const { user, store } = renderFeatureIntro();

    act(() => jest.runOnlyPendingTimers());

    const closeButton = await screen.findByTestId("bottom-sheet-header-close-button");
    await user.press(closeButton);
    fireEvent(closeButton, "dismiss");
    act(() => jest.runOnlyPendingTimers());

    await waitFor(() => {
      expect(store.getState().backupHubFeatureIntro.isOpen).toBe(false);
    });
    expect(track).toHaveBeenCalledWith("modal_dismissed", {
      page: BACKUP_HUB_FEATURE_INTRO_PAGE,
      source: BACKUP_HUB_FEATURE_INTRO_SOURCE,
    });
  });

  it("should open programmatically via dispatchable action", async () => {
    const { store } = renderFeatureIntro({ isOpen: false });

    act(() => {
      store.dispatch(openBackupHubFeatureIntro());
      jest.runOnlyPendingTimers();
    });

    expect(await screen.findByText("Create a backup you can't lose")).toBeOnTheScreen();
  });

  it("should handle backup-hub deeplink by navigating to portfolio and opening the sheet", async () => {
    const dispatch = jest.fn();
    const config = { screens: {} };

    handleBackupHubDeeplink({
      isLwmBackupHubEnabled: true,
      hasCompletedOnboarding: true,
      dispatch,
      config,
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "backupHubFeatureIntro/tickBackupHubFeatureIntroDeeplink" }),
    );
  });

  it("should open the sheet when deeplink nonce increments after the feature flag is ready", async () => {
    const { store } = renderFeatureIntro({ isOpen: false, deeplinkNonce: 0 });

    act(() => {
      store.dispatch(tickBackupHubFeatureIntroDeeplink());
      jest.runOnlyPendingTimers();
    });

    expect(await screen.findByText("Create a backup you can't lose")).toBeOnTheScreen();
    expect(store.getState().backupHubFeatureIntro.isOpen).toBe(true);
  });
});
