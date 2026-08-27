import React from "react";
import { Linking, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceModelInfo } from "@ledgerhq/types-live";
import { FEATURE_FLAGS_DEFAULTS, type Features } from "@shared/feature-flags";
import {
  LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
  LARGE_SCREEN_UPSELL_UTM_CAMPAIGN,
  LARGE_SCREEN_UPSELL_UTM_MEDIUM,
  LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM,
} from "@features/flow-large-screen-upsell/utils/upsellCta";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { screen as analyticsScreen, track } from "~/analytics";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { urls } from "~/utils/urls";
import { BackupHubScreen } from "../screens/BackupHubScreen";
import { resetBackupHubFeatureIntroViewTracking } from "../analytics";
import {
  BACKUP_HUB_RECOVER_DEEPLINK_QUERY,
  BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK,
  BACKUP_HUB_TRACKING_BUTTON,
  BACKUP_HUB_TRACKING_PAGE_NAME,
  BACKUP_HUB_UPSELL_TRACKING_BUTTON,
  BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
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

const NANO_UPSELL_DEVICE_MODEL = {
  [DeviceModelId.nanoS]: "lns",
  [DeviceModelId.nanoSP]: "lnsp",
  [DeviceModelId.nanoX]: "lnx",
} as const;

const overrideWith = (
  subscriptionState: LedgerRecoverSubscriptionStateEnum,
  devicesModelList: DeviceModelId[] = [],
  lastSeenModelId?: DeviceModelId,
  largeScreenUpsell: Features["largeScreenUpsell"] = { enabled: true },
) =>
  withFlagOverrides(
    {
      lwmBackupHub: { enabled: true },
      protectServicesMobile: { enabled: true, params: { protectId: PROTECT_ID } },
      largeScreenUpsell,
    },
    (state: State): State => {
      const withSub = seedSubscriptionState(subscriptionState)(state);
      const seenModelIds = lastSeenModelId
        ? [...devicesModelList.filter(id => id !== lastSeenModelId), lastSeenModelId]
        : devicesModelList;

      return {
        ...withSub,
        settings: {
          ...withSub.settings,
          knownDeviceModelIds: {
            ...withSub.settings.knownDeviceModelIds,
            ...Object.fromEntries(devicesModelList.map(id => [id, true])),
          },
          seenDevices: seenModelIds.map(modelId => ({ modelId }) as DeviceModelInfo),
        },
      };
    },
  );

describe("BackupHub screen (mobile)", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    resetBackupHubFeatureIntroViewTracking();
  });

  it("renders the not-subscribed variant with a discover CTA that opens the one-month-free Recover deeplink", async () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { user, store } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION),
    });

    expect(screen.getByTestId("backup-hub")).toBeOnTheScreen();
    expect(await screen.findByText("Ledger Recover")).toBeOnTheScreen();
    expect(screen.getByTestId(RECOVER_NOTIFICATION_DOT_TEST_ID)).toBeOnTheScreen();

    const cta = screen.getByTestId("backup-hub-recover-cta");
    await user.press(cta);

    expect(store.getState().backupHubFeatureIntro.isOpen).toBe(false);
    expect(openURLSpy).toHaveBeenCalledWith(
      `${RECOVER_DEEPLINK_BASE}/${PROTECT_ID}?redirectTo=${BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK.redirectTo}&source=${BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK.source}&ajs_recover_source=${BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK.source}&ajs_recover_campaign=${BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK.campaign}&ajs_prop_source=${BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK.source}&ajs_prop_campaign=${BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK.campaign}`,
    );
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Ledger Recover",
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
      status: "New",
    });
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

  it.each([DeviceModelId.nanoS, DeviceModelId.nanoSP, DeviceModelId.nanoX])(
    "shows the Recovery Key warning copy for %s",
    async deviceModelId => {
      render(<BackupHubTestNavigator />, {
        overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION, [
          deviceModelId,
        ]),
      });

      expect(await screen.findByText("Not compatible with your device")).toBeVisible();
      expect(screen.queryByText("A PIN-protected smart card.")).toBeNull();
    },
  );

  it("keeps the Recovery Key row unchanged when a large-screen device is known", async () => {
    render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION, [
        DeviceModelId.nanoS,
        DeviceModelId.stax,
      ]),
    });

    expect(await screen.findByText("A PIN-protected smart card.")).toBeVisible();
    expect(screen.queryByText("Not compatible with your device")).toBeNull();
  });

  it.each([
    [
      "the backup-hub-recovery-key-text-warning placement is off",
      (() => {
        const defaultParams = FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params;
        if (!defaultParams) {
          throw new Error("Expected large-screen upsell default params");
        }
        return {
          enabled: true,
          params: {
            ...defaultParams,
            banners: {
              ...defaultParams.banners,
              "backup-hub-recovery-key-text-warning": false,
            },
          },
        };
      })(),
    ],
    ["the large-screen upsell campaign is off", { enabled: false }],
  ] as const)("keeps the Recovery Key row unchanged when %s", async (_, largeScreenUpsell) => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(
        LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
        [DeviceModelId.nanoS],
        undefined,
        largeScreenUpsell,
      ),
    });

    expect(await screen.findByText("A PIN-protected smart card.")).toBeVisible();
    expect(screen.queryByText("Not compatible with your device")).toBeNull();

    await user.press(screen.getByTestId("backup-hub-physical-row-recovery-key"));

    expect(openURLSpy).toHaveBeenCalledWith(urls.backupHub.recoveryKey);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: BACKUP_HUB_TRACKING_BUTTON.recoveryKey,
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
    });
    expect(track).not.toHaveBeenCalledWith("deeplink_clicked", expect.anything());
  });

  it("uses the last-seen nano for Recovery Key upsell analytics when several nanos are known", async () => {
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { user } = render(<BackupHubTestNavigator />, {
      overrideInitialState: overrideWith(
        LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
        [DeviceModelId.nanoS, DeviceModelId.nanoX],
        DeviceModelId.nanoX,
      ),
    });

    const upsellAnalyticsProps = {
      deviceModel: NANO_UPSELL_DEVICE_MODEL[DeviceModelId.nanoX],
      personalRecoOptIn: false,
      offerType: "none",
      platform: "lwm",
    };
    expect(analyticsScreen).toHaveBeenCalledWith(
      BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
      undefined,
      {
        name: BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
        ...upsellAnalyticsProps,
      },
      false,
    );

    await user.press(await screen.findByTestId("backup-hub-physical-row-recovery-key"));

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: BACKUP_HUB_UPSELL_TRACKING_BUTTON,
        page: BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
        deviceModel: NANO_UPSELL_DEVICE_MODEL[DeviceModelId.nanoX],
      }),
    );
  });

  it.each([DeviceModelId.nanoS, DeviceModelId.nanoSP, DeviceModelId.nanoX] as const)(
    "opens the upsell LP with backups UTM when Recovery Key is clicked on %s",
    async deviceModelId => {
      const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

      const { user } = render(<BackupHubTestNavigator />, {
        overrideInitialState: overrideWith(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION, [
          deviceModelId,
        ]),
      });

      await user.press(await screen.findByTestId("backup-hub-physical-row-recovery-key"));

      expect(openURLSpy).toHaveBeenCalledTimes(1);
      const openedUrl = new URL(String(openURLSpy.mock.calls[0][0]));
      expect(openedUrl.origin + openedUrl.pathname).toBe(
        "https://shop.ledger.com/pages/ledger-nano-upgrade-program",
      );
      expect(openedUrl.searchParams.get("utm_source")).toBe(
        LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM.mobile,
      );
      expect(openedUrl.searchParams.get("utm_medium")).toBe(LARGE_SCREEN_UPSELL_UTM_MEDIUM);
      expect(openedUrl.searchParams.get("utm_campaign")).toBe(LARGE_SCREEN_UPSELL_UTM_CAMPAIGN);
      expect(openedUrl.searchParams.get("utm_content")).toBe(
        LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
      );
      const upsellAnalyticsProps = {
        deviceModel: NANO_UPSELL_DEVICE_MODEL[deviceModelId],
        personalRecoOptIn: false,
        offerType: "none",
        platform: "lwm",
      };
      expect(analyticsScreen).toHaveBeenCalledWith(
        BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
        undefined,
        {
          name: BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
          ...upsellAnalyticsProps,
        },
        false,
      );
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: BACKUP_HUB_UPSELL_TRACKING_BUTTON,
        page: BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
        ...upsellAnalyticsProps,
      });
      expect(track).toHaveBeenCalledWith("deeplink_clicked", {
        page: BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
        deeplinkSource: LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM.mobile,
        deeplinkMedium: LARGE_SCREEN_UPSELL_UTM_MEDIUM,
        deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM_CAMPAIGN,
        ...upsellAnalyticsProps,
      });
    },
  );
});
