import React from "react";
import { Linking, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { screen as analyticsScreen, track } from "~/analytics";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { urls } from "~/utils/urls";
import { BackupHubScreen } from "../screens/BackupHubScreen";
import {
  BACKUP_HUB_FEATURE_INTRO_PAGE,
  BACKUP_HUB_FEATURE_INTRO_SOURCE,
  resetBackupHubFeatureIntroViewTracking,
} from "../analytics";
import {
  BACKUP_HUB_RECOVER_DEEPLINK_QUERY,
  BACKUP_HUB_TRACKING_PAGE_NAME,
  RECOVER_DEEPLINK_BASE,
} from "../constants";
import { RECOVER_NOTIFICATION_DOT_TEST_ID } from "../components/ShieldCheckNotificationIcon";

const PROTECT_ID = "protect-test";

function RecoverStub() {
  return <Text>RECOVER_SCREEN</Text>;
}

const Stack = createNativeStackNavigator();

function BackupHubTestNavigator() {
  return (
    <SafeAreaProvider
      initialMetrics={{
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
        frame: { x: 0, y: 0, width: 0, height: 0 },
      }}
    >
      <Stack.Navigator
        initialRouteName={ScreenName.BackupHub}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={ScreenName.BackupHub} component={BackupHubScreen} />
        <Stack.Screen name={ScreenName.Recover} component={RecoverStub} />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
}

const seedSubscriptionState =
  (subscriptionState: LedgerRecoverSubscriptionStateEnum) =>
  (state: State): State => ({
    ...state,
    settings: { ...state.settings, language: "en" },
    recoverState: {
      protectIdState: { [PROTECT_ID]: { subscriptionState, displayBanner: true } },
    },
  });

const overrideWith = (subscriptionState: LedgerRecoverSubscriptionStateEnum) =>
  withFlagOverrides(
    {
      lwmBackupHub: { enabled: true },
      protectServicesMobile: { enabled: true, params: { protectId: PROTECT_ID } },
    },
    seedSubscriptionState(subscriptionState),
  );

describe("BackupHub screen (mobile)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    resetBackupHubFeatureIntroViewTracking();
  });

  it("renders the not-subscribed variant with a discover CTA that opens the Feature Intro", async () => {
    const { user, store } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    expect(screen.getByTestId("backup-hub")).toBeOnTheScreen();
    expect(await screen.findByText("Ledger Recover")).toBeOnTheScreen();
    expect(screen.getByTestId(RECOVER_NOTIFICATION_DOT_TEST_ID)).toBeOnTheScreen();

    const cta = screen.getByTestId("backup-hub-recover-cta");
    await user.press(cta);

    expect(store.getState().backupHubFeatureIntro.isOpen).toBe(true);
    expect(screen.queryByText("RECOVER_SCREEN")).toBeNull();
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Ledger Recover",
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
      status: "New",
    });
    expect(jest.mocked(analyticsScreen)).toHaveBeenCalledWith(
      BACKUP_HUB_FEATURE_INTRO_PAGE,
      undefined,
      {
        name: BACKUP_HUB_FEATURE_INTRO_PAGE,
        source: BACKUP_HUB_FEATURE_INTRO_SOURCE,
      },
    );
    expect(
      jest
        .mocked(analyticsScreen)
        .mock.calls.filter(([page]) => page === BACKUP_HUB_FEATURE_INTRO_PAGE),
    ).toHaveLength(1);
  });

  it("opens the ongoing-subscription Recover deeplink for the in-progress variant", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY),
    });

    expect(await screen.findByText("Complete activation")).toBeOnTheScreen();
    expect(screen.queryByTestId("backup-hub-recover-cta")).toBeNull();
    expect(screen.getByTestId(RECOVER_NOTIFICATION_DOT_TEST_ID)).toBeOnTheScreen();

    await user.press(screen.getByTestId("backup-hub-recover-row"));

    expect(openURLSpy).toHaveBeenCalledWith(
      `${RECOVER_DEEPLINK_BASE}/${PROTECT_ID}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.inProgress}`,
    );
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Ledger Recover",
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
      status: "in progress",
    });
  });

  it("opens the subscribed Recover deeplink for the done variant", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE),
    });

    expect(await screen.findByText("Manage your backup")).toBeOnTheScreen();
    expect(screen.queryByTestId("backup-hub-recover-cta")).toBeNull();
    expect(screen.queryByTestId(RECOVER_NOTIFICATION_DOT_TEST_ID)).toBeNull();

    await user.press(screen.getByTestId("backup-hub-recover-row"));

    expect(openURLSpy).toHaveBeenCalledWith(
      `${RECOVER_DEEPLINK_BASE}/${PROTECT_ID}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.done}`,
    );
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Ledger Recover",
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
      status: "done",
    });
  });

  it("opens the shop via Linking.openURL when a physical row is pressed", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    await user.press(await screen.findByTestId("backup-hub-physical-row-recovery-key"));

    expect(openURLSpy).toHaveBeenCalledWith(urls.backupHub.recoveryKey);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Ledger Recovery Key",
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
    });
  });

  it("opens the compare-all backup solutions shop link from the footer", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    await user.press(await screen.findByTestId("backup-hub-compare-footer"));

    expect(openURLSpy).toHaveBeenCalledWith(urls.backupHub.compareAll);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Compare all",
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
    });
  });
});
