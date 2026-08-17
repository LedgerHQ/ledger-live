import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { addNewDeviceModel, setLastSeenDeviceInfo } from "~/renderer/actions/settings";
import { setRecoverState } from "~/renderer/reducers/recoverState";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { isModalOpened } from "~/renderer/reducers/modals";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";
import { ContextMenu } from "LLD/features/MyWallet/components/ContextMenu";
import { RECOVER_NOTIFICATION_DOT_TEST_ID } from "LLD/features/BackupHub/components/ShieldCheckNotificationIcon";
import {
  BACKUP_HUB_RECOVER_DEEPLINK_QUERY,
  BACKUP_HUB_TRACKING_BUTTON,
  BACKUP_HUB_TRACKING_PAGE_NAME,
  BACKUP_HUB_UPSELL_DEEPLINK,
  RECOVER_DEEPLINK_BASE,
} from "LLD/features/BackupHub/constants";

const PROTECT_ID = "protect-id";
const RECOVER_HOME_PATH = "/recover/protect-id";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hooks/recoverFeatureFlag"),
  useAccountPath: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

const mockOpenURL = jest.mocked(openURL);
const mockUseAccountPath = jest.mocked(useAccountPath);

const backupHubState = withFlagOverrides({
  protectServicesDesktop: {
    enabled: true,
    params: { protectId: PROTECT_ID, openRecoverFromSidebar: true },
  },
  lwdBackupHub: { enabled: true },
});

const NANO_UPSELL_DEVICE_MODEL = {
  [DeviceModelId.nanoS]: "lns",
  [DeviceModelId.nanoSP]: "lnsp",
  [DeviceModelId.nanoX]: "lnx",
} as const;

const openHub = async (options?: Parameters<typeof render>[1]) => {
  const utils = render(<ContextMenu />, { initialState: backupHubState, ...options });

  await utils.user.click(screen.getByRole("button", { name: "My Wallet" }));
  await utils.user.click(await screen.findByTestId("my-wallet-action-recover"));
  await screen.findByTestId("backup-hub");

  return utils;
};

const openHubWithDevices = async (
  devicesModelList: DeviceModelId[],
  lastSeenModelId?: DeviceModelId,
) => {
  const utils = render(<ContextMenu />, { initialState: backupHubState });
  for (const deviceModelId of devicesModelList) {
    utils.store.dispatch(addNewDeviceModel({ deviceModelId }));
  }
  if (lastSeenModelId) {
    utils.store.dispatch(
      setLastSeenDeviceInfo({
        lastSeenDevice: { modelId: lastSeenModelId } as DeviceModelInfo,
        latestFirmware: null,
      }),
    );
  }

  await utils.user.click(screen.getByRole("button", { name: "My Wallet" }));
  await utils.user.click(await screen.findByTestId("my-wallet-action-recover"));
  await screen.findByTestId("backup-hub");

  return utils;
};

describe("BackupHub", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountPath.mockReturnValue(undefined);
  });

  it("opens the Backup Hub inside the popover with the Recover and physical rows", async () => {
    await openHub();

    expect(screen.getByTestId("backup-hub-recover-row")).toBeVisible();
    expect(screen.getByTestId("backup-hub-physical-row-recovery-key")).toBeVisible();
    expect(screen.getByTestId("backup-hub-physical-row-secret-recovery-phrase")).toBeVisible();
    expect(track).toHaveBeenCalledWith("page_viewed", { page: BACKUP_HUB_TRACKING_PAGE_NAME });
  });

  it("shows the not-subscribed variant with a primary CTA and the red notification dot by default", async () => {
    await openHub();

    expect(screen.getByRole("button", { name: "Discover" })).toBeVisible();
    expect(screen.getByTestId(RECOVER_NOTIFICATION_DOT_TEST_ID)).toBeVisible();
  });

  it("shows the done variant without a primary CTA", async () => {
    const utils = render(<ContextMenu />, { initialState: backupHubState });
    utils.store.dispatch(
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
      }),
    );

    await utils.user.click(screen.getByRole("button", { name: "My Wallet" }));
    await utils.user.click(await screen.findByTestId("my-wallet-action-recover"));

    await screen.findByTestId("backup-hub");
    expect(screen.queryByRole("button", { name: "Discover" })).not.toBeInTheDocument();
    expect(screen.queryByTestId(RECOVER_NOTIFICATION_DOT_TEST_ID)).not.toBeInTheDocument();
  });

  it("opens the subscribed Recover deeplink when clicking the Recover row in the done variant", async () => {
    const utils = render(<ContextMenu />, { initialState: backupHubState });
    utils.store.dispatch(
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
      }),
    );

    await utils.user.click(screen.getByRole("button", { name: "My Wallet" }));
    await utils.user.click(await screen.findByTestId("my-wallet-action-recover"));
    await screen.findByTestId("backup-hub");

    await utils.user.click(screen.getByTestId("backup-hub-recover-row"));

    expect(mockOpenURL).toHaveBeenCalledWith(
      `${RECOVER_DEEPLINK_BASE}/${PROTECT_ID}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.done}`,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows the in-progress variant with the warning copy and no primary CTA", async () => {
    const utils = render(<ContextMenu />, { initialState: backupHubState });
    utils.store.dispatch(
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
      }),
    );

    await utils.user.click(screen.getByRole("button", { name: "My Wallet" }));
    await utils.user.click(await screen.findByTestId("my-wallet-action-recover"));

    await screen.findByTestId("backup-hub");
    expect(screen.getByText("Complete activation")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Discover" })).not.toBeInTheDocument();
    expect(screen.getByTestId(RECOVER_NOTIFICATION_DOT_TEST_ID)).toBeVisible();
  });

  it("opens the ongoing-subscription Recover deeplink when clicking the Recover row in the in-progress variant", async () => {
    const utils = render(<ContextMenu />, { initialState: backupHubState });
    utils.store.dispatch(
      setRecoverState({
        protectId: PROTECT_ID,
        subscriptionState: LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
      }),
    );

    await utils.user.click(screen.getByRole("button", { name: "My Wallet" }));
    await utils.user.click(await screen.findByTestId("my-wallet-action-recover"));
    await screen.findByTestId("backup-hub");

    await utils.user.click(screen.getByTestId("backup-hub-recover-row"));

    expect(mockOpenURL).toHaveBeenCalledWith(
      `${RECOVER_DEEPLINK_BASE}/${PROTECT_ID}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.inProgress}`,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to the Recover Live App home when clicking the Recover row", async () => {
    mockUseAccountPath.mockReturnValue(RECOVER_HOME_PATH);

    const { user } = await openHub();

    await user.click(screen.getByTestId("backup-hub-recover-row"));

    expect(mockNavigate).toHaveBeenCalledWith(RECOVER_HOME_PATH);
    await waitFor(() => expect(screen.queryByTestId("backup-hub")).not.toBeInTheDocument());
  });

  it("falls back to MODAL_PROTECT_DISCOVER when no Live App path is available", async () => {
    const { user, store } = await openHub({
      initialState: withFlagOverrides({
        protectServicesDesktop: { enabled: true, params: { protectId: PROTECT_ID } },
        lwdBackupHub: { enabled: true },
      }),
    });

    await user.click(screen.getByTestId("backup-hub-recover-row"));

    expect(isModalOpened(store.getState(), "MODAL_PROTECT_DISCOVER")).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("opens the shop with UTM params when clicking a physical row", async () => {
    const { user } = await openHub();

    await user.click(screen.getByTestId("backup-hub-physical-row-recovery-key"));

    expect(mockOpenURL).toHaveBeenCalledTimes(1);
    const calledWith = mockOpenURL.mock.calls[0][0];
    expect(calledWith).toContain(
      "https://shop.ledger.com/products/ledger-recovery-key/single-backup",
    );
    expect(calledWith).toContain("utm_source=Ledger_Wallet");
    expect(calledWith).toContain("utm_campaign=26-06-AlwaysOn-ALL-Awareness-LLD");
  });

  it.each([DeviceModelId.nanoS, DeviceModelId.nanoSP, DeviceModelId.nanoX])(
    "shows the Recovery Key warning copy for %s",
    async deviceModelId => {
      await openHubWithDevices([deviceModelId]);

      expect(screen.getByText("Not compatible with your device")).toBeVisible();
      expect(screen.queryByText("A PIN-protected smart card.")).not.toBeInTheDocument();
    },
  );

  it("keeps the Recovery Key row unchanged when a large-screen device is known", async () => {
    await openHubWithDevices([DeviceModelId.nanoS, DeviceModelId.stax]);

    expect(screen.getByText("A PIN-protected smart card.")).toBeVisible();
    expect(screen.queryByText("Not compatible with your device")).not.toBeInTheDocument();
  });

  it("uses the last-seen nano for Recovery Key upsell analytics when several nanos are known", async () => {
    const { user } = await openHubWithDevices(
      [DeviceModelId.nanoS, DeviceModelId.nanoX],
      DeviceModelId.nanoX,
    );

    await user.click(screen.getByTestId("backup-hub-physical-row-recovery-key"));

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: BACKUP_HUB_TRACKING_BUTTON.recoveryKey,
        deviceModel: NANO_UPSELL_DEVICE_MODEL[DeviceModelId.nanoX],
      }),
    );
  });

  it.each([DeviceModelId.nanoS, DeviceModelId.nanoSP, DeviceModelId.nanoX])(
    "opens the upsell LP with backups UTM when Recovery Key is clicked on %s",
    async deviceModelId => {
      const { user } = await openHubWithDevices([deviceModelId]);

      await user.click(screen.getByTestId("backup-hub-physical-row-recovery-key"));

      expect(mockOpenURL).toHaveBeenCalledTimes(1);
      const openedUrl = new URL(String(mockOpenURL.mock.calls[0][0]));
      expect(openedUrl.origin + openedUrl.pathname).toBe(
        "https://shop.ledger.com/pages/ledger-nano-upgrade-program",
      );
      expect(openedUrl.searchParams.get("utm_source")).toBe("ledger_wallet_desktop");
      expect(openedUrl.searchParams.get("utm_medium")).toBe("ledger_live");
      expect(openedUrl.searchParams.get("utm_campaign")).toBe("nano_upgrade_program");
      expect(openedUrl.searchParams.get("utm_content")).toBe("backups_cta");
      const upsellAnalyticsProps = {
        deviceModel: NANO_UPSELL_DEVICE_MODEL[deviceModelId],
        personalRecoOptIn: false,
        offerType: "none",
        platform: "lwd",
      };
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: BACKUP_HUB_TRACKING_BUTTON.recoveryKey,
        page: BACKUP_HUB_TRACKING_PAGE_NAME,
        ...upsellAnalyticsProps,
      });
      expect(track).toHaveBeenCalledWith("deeplink_clicked", {
        page: BACKUP_HUB_TRACKING_PAGE_NAME,
        deeplinkSource: BACKUP_HUB_UPSELL_DEEPLINK.source,
        deeplinkMedium: BACKUP_HUB_UPSELL_DEEPLINK.medium,
        deeplinkCampaign: BACKUP_HUB_UPSELL_DEEPLINK.campaign,
        ...upsellAnalyticsProps,
      });
    },
  );

  it("returns to the menu when pressing back", async () => {
    const { user } = await openHub();

    await user.click(screen.getByTestId("backup-hub-back"));

    await waitFor(() => expect(screen.getByTestId("my-wallet-actions-list")).toBeVisible());
    await waitFor(() => expect(screen.queryByTestId("backup-hub")).not.toBeInTheDocument());
  });
});
