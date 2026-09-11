import {
  mockServerEnv,
  type MockServerSession,
  deviceUnderTest,
  MockServerDevice,
} from "@ledgerhq/live-e2e-shared/mockServer";
import base from "tests/fixtures/common";

type MockServerFixtures = {
  mockServerSession: MockServerSession;
  mockDevice: MockServerDevice;
  mockDeviceParams: Partial<MockServerDevice>;
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

  mockServerSession: async ({ mockDevice }, use) => {
    await use({ devices: [mockDevice] });
  },

  env: async ({ mockServerSession }, use) => {
    await use(await mockServerEnv(mockServerSession));
  },
});

export default test;
