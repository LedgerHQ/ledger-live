import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { deviceUnderTest } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import {
  disposeMockServerSession,
  provisionMockServerSession,
  type MockServerDeviceWithId,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import {
  getLatestFirmwareVersion,
  getSpeculosModel,
} from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { device } from "detox";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { launchApp, waitForIosTransitionEnd } from "@e2e/helpers/commonHelpers";
import { MockServerDevicePage } from "@e2e/page/mockServerDevice.page";
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

// Id of a known device that the session holds only once the test turns it on.
const LATE_DEVICE_ID = "e2e-late-device";

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
  let mockServer: MockServerDevicePage | undefined;
  let mockDevice: MockServerDeviceWithId | undefined;

  beforeAll(async () => {
    const { modelId, apps: _noApps, ...deviceConfig } = deviceUnderTest();
    const bluetoothDevice = {
      ...deviceConfig,
      connectivity_type: "BLE",
      firmware_version: await getLatestFirmwareVersion(modelId),
    };
    session = await provisionMockServerSession(deviceInSession ? [bluetoothDevice] : []);
    mockServer = new MockServerDevicePage(session.baseUrl, session.token);
    const deviceId = deviceInSession ? await mockServer.deviceId() : LATE_DEVICE_ID;
    mockDevice = { ...bluetoothDevice, id: deviceId };

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

  const getMockDevice = (): MockServerDeviceWithId => {
    if (!mockDevice) throw new Error("The device list setup did not run");
    return mockDevice;
  };

  return {
    deviceKey: () => knownDeviceKey(getMockDevice().id),
    /** Adds the device to the session, as when the user turns it on near the phone. */
    turnOnDevice: async () => {
      if (!mockServer) throw new Error("The device list setup did not run");
      await mockServer.turnOnDevice(getMockDevice());
    },
  };
}

type DeviceListTestOptions = {
  tmsLinks: string[];
  tags: string[];
};

function tagDeviceListScenario({ tmsLinks, tags }: DeviceListTestOptions) {
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
}

/**
 * The device list polls the mock server, so the app never goes idle on iOS. The list also ignores
 * taps until the transition to My Wallet ends: it pauses while its screen is not focused.
 */
async function openMyWalletDeviceList() {
  await app.common.disableSynchronizationForiOS();
  await app.mainNavigation.openMyWallet();
  await waitForIosTransitionEnd();
}

export function runOpenMyLedgerFromKnownDeviceTest(options: DeviceListTestOptions) {
  setTeamOwner(Team.MY_LEDGER_ONBOARDING);
  describeIfBluetoothModel("Device list - open My Ledger from a known device", () => {
    const setup = setupDeviceList({ deviceInSession: true, deviceKnown: true });
    tagDeviceListScenario(options);

    it("Lists the known device as available and opens My Ledger from it", async () => {
      await openMyWalletDeviceList();
      await app.myWallet.deviceList.expectDeviceStatus({
        deviceKey: setup.deviceKey(),
        statusLabel: STATUS_LABELS.available,
      });
      await app.myWallet.deviceList.openMyLedger(setup.deviceKey());
    });
  });
}

export function runAddDeviceFromEmptyListTest(options: DeviceListTestOptions) {
  setTeamOwner(Team.MY_LEDGER_ONBOARDING);
  describeIfBluetoothModel("Device list - add a device from the empty list", () => {
    const setup = setupDeviceList({ deviceInSession: true, deviceKnown: false });
    tagDeviceListScenario(options);

    it("Adds the device, opens My Ledger and lists the device as connected", async () => {
      await openMyWalletDeviceList();
      await app.myWallet.deviceList.openAddModeFromEmptyList();
      await app.myWallet.deviceList.addDeviceAndOpenMyLedger();
      await app.manager.goBackToMyWallet();
      await app.myWallet.deviceList.expectDeviceStatus({
        deviceKey: setup.deviceKey(),
        statusLabel: STATUS_LABELS.connected,
      });
    });
  });
}

export function runKnownDeviceNotAroundTest(options: DeviceListTestOptions) {
  setTeamOwner(Team.MY_LEDGER_ONBOARDING);
  describeIfBluetoothModel("Device list - known device that is not around", () => {
    const setup = setupDeviceList({ deviceInSession: false, deviceKnown: true });
    tagDeviceListScenario(options);

    it("Waits for the known device when tapped and opens My Ledger once it is on", async () => {
      await openMyWalletDeviceList();
      await app.myWallet.deviceList.expectDeviceStatus({
        deviceKey: setup.deviceKey(),
        statusLabel: STATUS_LABELS.unavailable,
      });
      await app.myWallet.deviceList.waitForDevice(setup.deviceKey());
      await setup.turnOnDevice();
      await app.manager.expectDeviceInfoVisible();
    });
  });
}
