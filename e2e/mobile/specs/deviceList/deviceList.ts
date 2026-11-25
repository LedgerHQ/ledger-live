import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceUnderTest } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import {
  MockServerSessionHandle,
  disposeMockServerSession,
  provisionMockServerSession,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import {
  getLatestFirmwareVersion,
  getSpeculosModel,
} from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { device } from "detox";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { launchApp } from "@e2e/helpers/commonHelpers";
import type { PartialFeatures } from "@shared/feature-flags";

const DEVICE_LIST_FEATURE_FLAGS: PartialFeatures = {
  lwmMyWalletDeviceList: { enabled: true },
  // Off, so that Add opens the Add mode of the list and not the onboarding "Get started" screen.
  deviceOnboarding: { enabled: false },
};

// i18n `connectKnownOrNewDevice.status.*`.
const STATUS_LABELS = {
  unavailable: "Not connected",
  available: "Available",
  connected: "Connected",
};

const ABSENT_DEVICE_ID = "e2e-absent-device";

// `buildDeviceList` keys the row of a known device `known:<transport>:<id>`, and the transport id
// of the mock server is `mockserverIdentifier`.
const knownDeviceKey = (deviceId: string) => `known:MOCKSERVER:${deviceId}`;

const BLUETOOTH_MODELS = new Set<DeviceModelId>([
  DeviceModelId.nanoX,
  DeviceModelId.stax,
  DeviceModelId.europa,
  DeviceModelId.apex,
]);

// The list shows a known device that is not around only for Bluetooth. A USB device shows only
// while it is plugged in, and an unknown one shows outside of the Add mode.
const describeIfBluetoothModel = (...args: Parameters<typeof describe>) =>
  BLUETOOTH_MODELS.has(getSpeculosModel())
    ? describe(...args)
    : describe.skip("[USB-only device] " + args[0], args[1]);

type DeviceListSetup = {
  /** The mock server session holds the device, so the app finds it. */
  deviceInSession: boolean;
  /** The app knows the device, as if it connected to it before. */
  deviceKnown: boolean;
};

function setupDeviceList({ deviceInSession, deviceKnown }: DeviceListSetup) {
  let session: { baseUrl: string; token: string } | undefined;
  let deviceId = ABSENT_DEVICE_ID;

  beforeAll(async () => {
    const { modelId, apps: _noApps, ...deviceConfig } = deviceUnderTest();
    const devices = deviceInSession
      ? [
          {
            ...deviceConfig,
            connectivity_type: "BLE",
            firmware_version: await getLatestFirmwareVersion(modelId),
          },
        ]
      : [];
    session = await provisionMockServerSession(devices);
    if (deviceInSession) {
      deviceId = await new MockServerSessionHandle(session.baseUrl, session.token).deviceId();
    }

    const port = await launchApp({
      newInstance: true,
      launchArgs: {
        mockServerUrl: session.baseUrl,
        mockServerToken: session.token,
        ...(deviceKnown ? { mockServerModel: modelId, mockServerDeviceId: deviceId } : {}),
      },
    });
    await device.reverseTcpPort(port);
    await app.init({ userdata: "skip-onboarding", featureFlags: DEVICE_LIST_FEATURE_FLAGS });
    await app.mainNavigation.waitForWallet40Ready();
  });

  afterAll(async () => {
    if (!session) return;
    try {
      await disposeMockServerSession(session.baseUrl, session.token);
    } catch {
      // The session expires on its own. A failed dispose must not hide the spec result.
    }
  });

  return { deviceKey: () => knownDeviceKey(deviceId) };
}

function tagDeviceListScenario(tmsLinks: string[], tags: string[]) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
}

/** The device list polls the mock server, so the app never goes idle on iOS. */
async function openMyWalletDeviceList() {
  await app.common.disableSynchronizationForiOS();
  await app.mainNavigation.openMyWallet();
}

export function runOpenMyLedgerFromKnownDeviceTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.MY_LEDGER_ONBOARDING);
  describeIfBluetoothModel("Device list - open My Ledger from a known device", () => {
    const setup = setupDeviceList({ deviceInSession: true, deviceKnown: true });
    tagDeviceListScenario(tmsLinks, tags);

    it("Lists the known device as available and opens My Ledger from it", async () => {
      await openMyWalletDeviceList();
      await app.myWallet.deviceList.expectDeviceStatus(setup.deviceKey(), STATUS_LABELS.available);
      await app.myWallet.deviceList.openMyLedger(setup.deviceKey());
    });
  });
}

export function runAddDeviceFromEmptyListTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.MY_LEDGER_ONBOARDING);
  describeIfBluetoothModel("Device list - add a device from the empty list", () => {
    const setup = setupDeviceList({ deviceInSession: true, deviceKnown: false });
    tagDeviceListScenario(tmsLinks, tags);

    it("Adds the device, opens My Ledger and lists the device as connected", async () => {
      await openMyWalletDeviceList();
      await app.myWallet.deviceList.openAddModeFromEmptyList();
      await app.myWallet.deviceList.addDeviceAndOpenMyLedger();
      await app.manager.goBackToMyWallet();
      await app.myWallet.deviceList.expectDeviceStatus(setup.deviceKey(), STATUS_LABELS.connected);
    });
  });
}

export function runKnownDeviceNotAroundTest(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.MY_LEDGER_ONBOARDING);
  describeIfBluetoothModel("Device list - known device that is not around", () => {
    const setup = setupDeviceList({ deviceInSession: false, deviceKnown: true });
    tagDeviceListScenario(tmsLinks, tags);

    it("Lists the known device as not connected and waits for it when tapped", async () => {
      await openMyWalletDeviceList();
      await app.myWallet.deviceList.expectDeviceStatus(
        setup.deviceKey(),
        STATUS_LABELS.unavailable,
      );
      await app.myWallet.deviceList.waitForDevice(setup.deviceKey());
    });
  });
}
