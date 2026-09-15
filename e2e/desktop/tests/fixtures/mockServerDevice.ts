import { expect } from "@playwright/test";
import { type MockServerDevice } from "@ledgerhq/live-e2e-shared/mockServer/types";
import { deviceUnderTest } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import { mockServerEnv } from "@ledgerhq/live-e2e-shared/mockServer/launchEnv";
import {
  attachMockServerSession,
  type MockServerSessionHandle,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import base from "tests/fixtures/common";

type MockServerFixtures = {
  mockDevice: MockServerDevice;
  mockDeviceParams: Partial<MockServerDevice>;
  mockServer: MockServerSessionHandle;
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
      expect(token).not.toBe("");
    }).toPass();

    await use(attachMockServerSession(token));
  },

  env: async ({ mockDevice }, use) => {
    await use(await mockServerEnv({ devices: [mockDevice] }));
  },
});

export default test;
