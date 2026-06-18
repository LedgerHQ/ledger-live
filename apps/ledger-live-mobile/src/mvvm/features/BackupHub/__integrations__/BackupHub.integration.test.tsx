import React from "react";
import { Linking, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { urls } from "~/utils/urls";
import { BackupHubScreen } from "../screens/BackupHubScreen";
import { BACKUP_HUB_RECOVER_DEEPLINK_QUERY, RECOVER_DEEPLINK_BASE } from "../constants";

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
  });

  it("renders the not-subscribed variant with a discover CTA that navigates to Recover", async () => {
    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    expect(screen.getByTestId("backup-hub")).toBeOnTheScreen();
    expect(await screen.findByText("Create a backup you can't lose")).toBeOnTheScreen();

    const cta = screen.getByTestId("backup-hub-recover-cta");
    await user.press(cta);

    expect(await screen.findByText("RECOVER_SCREEN")).toBeOnTheScreen();
  });

  it("opens the ongoing-subscription Recover deeplink for the in-progress variant", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY),
    });

    expect(await screen.findByText("Finish setting up your backup.")).toBeOnTheScreen();
    expect(screen.queryByTestId("backup-hub-recover-cta")).toBeNull();

    await user.press(screen.getByTestId("backup-hub-recover-row"));

    expect(openURLSpy).toHaveBeenCalledWith(
      `${RECOVER_DEEPLINK_BASE}/${PROTECT_ID}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.inProgress}`,
    );
  });

  it("opens the subscribed Recover deeplink for the done variant", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE),
    });

    expect(await screen.findByText("Manage your backup")).toBeOnTheScreen();
    expect(screen.queryByTestId("backup-hub-recover-cta")).toBeNull();

    await user.press(screen.getByTestId("backup-hub-recover-row"));

    expect(openURLSpy).toHaveBeenCalledWith(
      `${RECOVER_DEEPLINK_BASE}/${PROTECT_ID}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.done}`,
    );
  });

  it("opens the shop via Linking.openURL when a physical row is pressed", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    await user.press(await screen.findByTestId("backup-hub-physical-row-recovery-key"));

    expect(openURLSpy).toHaveBeenCalledWith(urls.backupHub.recoveryKey);
  });

  it("opens the compare-all backup solutions shop link from the footer", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    await user.press(await screen.findByTestId("backup-hub-compare-footer"));

    expect(openURLSpy).toHaveBeenCalledWith(urls.backupHub.compareAll);
  });
});
