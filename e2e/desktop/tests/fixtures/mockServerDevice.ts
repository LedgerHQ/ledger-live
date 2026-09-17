import { expect } from "@playwright/test";
import { type MockServerDevice } from "@ledgerhq/live-e2e-shared/mockServer/types";
import { deviceUnderTest } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import { resolveInstalledApps } from "@ledgerhq/live-e2e-shared/mockServer/installedApps";
import { type AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { mockServerEnv } from "@ledgerhq/live-e2e-shared/mockServer/launchEnv";
import {
  assertMockServerReachable,
  attachMockServerSession,
  type MockServerSessionHandle,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import base from "tests/fixtures/common";

const SESSION_TOKEN_TIMEOUT_MS = 30_000;

type MockServerFixtures = {
  mockDevice: MockServerDevice;
  mockDeviceParams: Partial<MockServerDevice>;
  mockServer: MockServerSessionHandle;
  installedApps: AppInfos[];
};

/**
 * Drives onboarding against an emulated device served by the Device Management Kit
 * mock server (see `renderer/mockServerTransport.ts`) rather than Speculos: the app
 * provisions a session at boot and the transport discovers the seeded device.
 */
export const test = base.extend<MockServerFixtures>({
  mockDeviceParams: [{}, { option: true }],

  installedApps: [[], { option: true }],

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

    await use(attachMockServerSession(token));
  },

  env: async ({ mockDevice, installedApps }, use) => {
    await assertMockServerReachable();

    // Install hashes are published per target id and firmware, so they are looked up
    // for the device under test — a seeded session then follows SPECULOS_DEVICE.
    const devices = installedApps.length
      ? [
          {
            ...mockDevice,
            apps: await resolveInstalledApps(
              mockDevice.modelId,
              installedApps.map(({ name }) => name),
            ),
          },
        ]
      : [mockDevice];

    await use(await mockServerEnv({ devices }));
  },
});

export default test;
