import { expect } from "@playwright/test";
import { deviceUnderTest, type MockDevice } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import { withInstallHashes } from "@ledgerhq/live-e2e-shared/mockServer/installedApps";
import { mockServerEnv } from "@ledgerhq/live-e2e-shared/mockServer/launchEnv";
import {
  assertMockServerReachable,
  mockServerBaseUrl,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import { MockServerDevicePage } from "tests/page/mockServerDevice.page";
import base from "tests/fixtures/common";

const SESSION_TOKEN_TIMEOUT_MS = 30_000;

type MockServerFixtures = {
  mockDevice: MockDevice;
  mockDeviceParams: Partial<MockDevice>;
  mockServer: MockServerDevicePage;
};

/**
 * Drives onboarding against an emulated device served by the Device Management Kit
 * mock server (see `renderer/mockServerTransport.ts`) rather than Speculos: the app
 * provisions a session at boot and the transport discovers the seeded device.
 */
export const test = base.extend<MockServerFixtures>({
  mockDeviceParams: [{}, { option: true }],

  mockDevice: async ({ mockDeviceParams }, use) => {
    await use({ ...deviceUnderTest(), ...mockDeviceParams });
  },

  // Attaches to the session the app created. Retrying as the token is published after launch.
  mockServer: async ({ page }, use) => {
    let token = "";
    await expect(async () => {
      token = (await page.evaluate(() => window.ledger?.getMockServerSessionToken?.())) ?? "";
      expect(token, "the app published no mock server session token").not.toBe("");
    }).toPass({ timeout: SESSION_TOKEN_TIMEOUT_MS });

    await use(new MockServerDevicePage(mockServerBaseUrl(), token));
  },

  env: async ({ mockDevice }, use) => {
    await assertMockServerReachable();

    // `apps` entries that do not pin a hash get one looked up for the device under test,
    // so a seeded session still follows SPECULOS_DEVICE.
    const devices = [
      mockDevice.apps?.length
        ? { ...mockDevice, apps: await withInstallHashes(mockDevice.modelId, mockDevice.apps) }
        : mockDevice,
    ];

    await use(await mockServerEnv({ devices }));
  },
});

export default test;
