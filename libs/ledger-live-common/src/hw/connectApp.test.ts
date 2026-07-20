import { ConnectAppDeviceAction } from "@ledgerhq/live-dmk-shared";
import connectAppFactory from "./connectApp";

const mockExecuteDeviceAction = jest.fn(() => ({
  observable: jest.fn(),
  cancel: jest.fn(),
}));
const mockDmk = {
  executeDeviceAction: mockExecuteDeviceAction,
};
const mockTransport = {
  dmk: mockDmk,
  sessionId: "session-id",
};

jest.mock("./deviceAccess", () => ({
  withDevice: () => (job: (transport: typeof mockTransport) => unknown) => job(mockTransport),
}));
jest.mock("./dmkUtils", () => ({
  isDmkTransport: jest.fn(() => true),
}));
jest.mock("../apps", () => ({
  getDeprecationConfig: jest.fn(),
  getMinVersion: jest.fn(),
  mustUpgrade: jest.fn(),
}));
jest.mock("@ledgerhq/live-dmk-shared", () => ({
  ConnectAppDeviceAction: jest.fn(),
}));
jest.mock("./connectAppEventMapper", () => ({
  ConnectAppEventMapper: jest.fn(() => ({
    map: jest.fn(),
  })),
}));

describe("connectAppFactory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      description: "no explicit onboarding policy",
      options: { isLdmkConnectAppEnabled: true },
      expectedValue: false,
    },
    {
      description: "an onboarding policy override",
      options: {
        isLdmkConnectAppEnabled: true,
        allowNonOnboardedDevice: true,
      },
      expectedValue: true,
    },
  ])(
    "GIVEN $description WHEN creating the DMK connect-app action THEN it applies the expected policy",
    ({ options, expectedValue }) => {
      // GIVEN
      const connectApp = connectAppFactory(options);

      // WHEN
      connectApp({
        deviceId: "device-id",
        deviceName: null,
        request: {
          appName: "Ethereum",
          allowPartialDependencies: false,
        },
      });

      // THEN
      expect(ConnectAppDeviceAction).toHaveBeenCalledWith({
        input: expect.objectContaining({
          allowNonOnboardedDevice: expectedValue,
        }),
      });
    },
  );
});
