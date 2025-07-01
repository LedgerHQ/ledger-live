import type {
  ApplicationDependency,
  GetDeviceMetadataDAOutput,
  InstallOrUpdateAppsDAIntermediateValue,
  DeviceSessionState,
} from "@ledgerhq/device-management-kit";
import {
  DeviceActionStatus,
  DeviceModelId,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";

import { makeDeviceActionInternalApiMock } from "../__test-utils__/makeInternalApi";
import {
  setupGetDeviceStatusMock,
  setupGetDeviceMetadataMock,
  setupInstallOrUpdateAppsMock,
  setupOpenAppWithDependenciesMock,
} from "../__test-utils__/setupTestMachine";
import { testDeviceActionStates } from "../__test-utils__/testDeviceActionStates";

import { ConnectAppDeviceAction } from "./ConnectAppDeviceAction";
import type { ConnectAppDAState } from "./types";

vi.mock("@ledgerhq/device-management-kit", async importOriginal => {
  const original = await importOriginal<typeof import("@ledgerhq/device-management-kit")>();
  return {
    ...original,
    GetDeviceStatusDeviceAction: vi.fn(() => ({
      makeStateMachine: vi.fn(),
    })),
    GetDeviceMetadataDeviceAction: vi.fn(() => ({
      makeStateMachine: vi.fn(),
    })),
    InstallOrUpdateAppsDeviceAction: vi.fn(() => ({
      makeStateMachine: vi.fn(),
    })),
    OpenAppWithDependenciesDeviceAction: vi.fn(() => ({
      makeStateMachine: vi.fn(),
    })),
  };
});

describe("OpenAppWithDependenciesDeviceAction", () => {
  const apiMock = makeDeviceActionInternalApiMock();

  const DEVICE_STATUS = {
    currentApp: "Ethereum",
    currentAppVersion: "3.4.5",
  };

  const DEVICE_METADATA = {
    firmwareUpdateContext: {},
  } as unknown as GetDeviceMetadataDAOutput;

  const INSTALL_INTERMEDIATE_VALUE: InstallOrUpdateAppsDAIntermediateValue = {
    requiredUserInteraction: UserInteractionRequired.None,
    installPlan: {
      installPlan: [{ versionName: "1inch" }] as any[],
      alreadyInstalled: ["Ethereum", "Uniswap"],
      missingApplications: [""],
      currentIndex: 0,
      currentProgress: 0.5,
    },
  };

  const INSTALL_RESULT = {
    successfullyInstalled: [{ versionName: "1inch" }] as any[],
    alreadyInstalled: ["Ethereum", "Uniswap"],
    missingApplications: [""],
  };

  const OPEN_APP_RESULT = {
    deviceMetadata: DEVICE_METADATA,
    installResult: INSTALL_RESULT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.getDeviceSessionState.mockReturnValue({
      deviceModelId: DeviceModelId.NANO_X,
    } as unknown as DeviceSessionState);
  });

  describe("success cases", () => {
    it("Connect app from dashboard", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupInstallOrUpdateAppsMock(INSTALL_RESULT, INSTALL_INTERMEDIATE_VALUE);
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "BOLOS" },
            dependencies: [{ name: "Ethereum" }, { name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceMetadata
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // OpenAppWithDependencies
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // Success
          {
            output: {
              deviceMetadata: DEVICE_METADATA,
              installResult: INSTALL_RESULT,
            },
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Connect app without derivation", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, INSTALL_INTERMEDIATE_VALUE);
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [{ name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceMetadata
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
              deviceDeprecation: undefined,
            },
            status: DeviceActionStatus.Pending,
          },
          // InstallOrUpdateApps
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
              deviceDeprecation: undefined,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // Success
          {
            output: {
              deviceMetadata: DEVICE_METADATA,
              installResult: INSTALL_RESULT,
            },
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Connect app with derivation", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, INSTALL_INTERMEDIATE_VALUE);
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [{ name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
            requiredDerivation: () => Promise.resolve("eth-address"),
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceMetadata
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
              deviceDeprecation: undefined,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
              deviceDeprecation: undefined,
            },
            status: DeviceActionStatus.Pending,
          },
          // InstallOrUpdateApps
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
              deviceDeprecation: undefined,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: { ...INSTALL_INTERMEDIATE_VALUE, deviceDeprecation: undefined },
            status: DeviceActionStatus.Pending,
          },
          // GetDerivation
          {
            intermediateValue: { ...INSTALL_INTERMEDIATE_VALUE, deviceDeprecation: undefined },
            status: DeviceActionStatus.Pending,
          },
          // Success
          {
            output: {
              deviceMetadata: DEVICE_METADATA,
              installResult: INSTALL_RESULT,
              derivation: "eth-address",
            },
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Connect app without dependencies without derivation, app already opened", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceStatusMock(DEVICE_STATUS);
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceStatus
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // Success
          {
            output: {},
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Connect app without dependencies with derivation, app already opened", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceStatusMock(DEVICE_STATUS);
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [],
            requireLatestFirmware: false,
            allowMissingApplication: false,
            requiredDerivation: () => Promise.resolve("eth-address"),
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceStatus
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // GetDerivation
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // Success
          {
            output: {
              derivation: "eth-address",
            },
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Connect app without dependencies without derivation, app not opened", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceStatusMock(DEVICE_STATUS);
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, INSTALL_INTERMEDIATE_VALUE);
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Bitcoin" },
            dependencies: [],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceStatus
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // GetDeviceMetadata
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // InstallOrUpdateApps
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // Success
          {
            output: {
              deviceMetadata: DEVICE_METADATA,
              installResult: INSTALL_RESULT,
            },
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));
  });

  describe("error cases", () => {
    it("Get device status error", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceStatusMock(DEVICE_STATUS, true);

        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceStatus
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // Error
          {
            error: new UnknownDAError("GetDeviceStatus failed"),
            status: DeviceActionStatus.Error,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Get device metadata error", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA, true);

        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "BOLOS" },
            dependencies: [{ name: "Ethereum" }, { name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceMetadata
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // Error
          {
            error: new UnknownDAError("GetDeviceMetadata failed"),
            status: DeviceActionStatus.Error,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Install apps error", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupInstallOrUpdateAppsMock(INSTALL_RESULT, INSTALL_INTERMEDIATE_VALUE, true);

        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "BOLOS" },
            dependencies: [{ name: "Ethereum" }, { name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceMetadata
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // InstallOrUpdateApps
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // Error
          {
            error: new UnknownDAError("InstallOrUpdateApps failed"),
            status: DeviceActionStatus.Error,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Open app error", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, INSTALL_INTERMEDIATE_VALUE, true);

        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [{ name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceMetadata
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // OpenAppWithDependencies
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // Error
          {
            error: new UnknownDAError("OpenAppWithDependencies failed"),
            status: DeviceActionStatus.Error,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Get derivation error", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, INSTALL_INTERMEDIATE_VALUE);

        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [{ name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
            requiredDerivation: () => {
              throw new UnknownDAError("Get derivation error");
            },
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceMetadata
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          // OpenAppWithDependencies
          {
            intermediateValue: {
              requiredUserInteraction: UserInteractionRequired.None,
              installPlan: null,
            },
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDerivation
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // Error
          {
            error: new UnknownDAError("Get derivation error"),
            status: DeviceActionStatus.Error,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));
  });

  describe("isAppOpened tests", () => {
    it("should return true when the current app matches and there are no constraints", () => {
      const application = { name: "TestApp" };
      const deviceStatus = {
        currentApp: "TestApp",
        currentAppVersion: "2.3.4",
      };
      const deviceModel = DeviceModelId.NANO_X;

      const result = ConnectAppDeviceAction.isAppOpened(application, deviceStatus, deviceModel);

      expect(result).toBe(true);
    });

    it("should return true when the current app matches and all applicable constraints are satisfied", () => {
      const application = {
        name: "TestApp",
        constraints: [
          {
            minVersion: "2.3.4",
            applicableModels: [DeviceModelId.NANO_X],
          },
          {
            minVersion: "2.3.5",
            exemptModels: [DeviceModelId.NANO_X],
          },
        ],
      } as ApplicationDependency;
      const deviceStatus = {
        currentApp: "TestApp",
        currentAppVersion: "2.3.4",
      };
      const deviceModel = DeviceModelId.NANO_X;

      const result = ConnectAppDeviceAction.isAppOpened(application, deviceStatus, deviceModel);

      expect(result).toBe(true);
    });

    it("should return false when the current app matches but applicable constraints are not satisfied", () => {
      const application = {
        name: "TestApp",
        constraints: [
          {
            minVersion: "2.3.4",
            exemptModels: [DeviceModelId.NANO_S],
          },
        ],
      } as ApplicationDependency;
      const deviceStatus = {
        currentApp: "TestApp",
        currentAppVersion: "2.3.3",
      };
      const deviceModel = DeviceModelId.NANO_X;

      const result = ConnectAppDeviceAction.isAppOpened(application, deviceStatus, deviceModel);

      expect(result).toBe(false);
    });

    it("should return true when the current app matches and applicable constraints exclude the device", () => {
      const application = {
        name: "TestApp",
        constraints: [
          {
            minVersion: "2.3.4",
            exemptModels: [DeviceModelId.NANO_X],
          },
        ],
      } as ApplicationDependency;
      const deviceStatus = {
        currentApp: "TestApp",
        currentAppVersion: "2.3.3",
      };
      const deviceModel = DeviceModelId.NANO_X;

      const result = ConnectAppDeviceAction.isAppOpened(application, deviceStatus, deviceModel);

      expect(result).toBe(true);
    });

    it("should return false when the app does not match", () => {
      const application = {
        name: "TestApp",
      };
      const deviceStatus = {
        currentApp: "OtherApp",
        currentAppVersion: "2.3.3",
      };
      const deviceModel = DeviceModelId.NANO_X;

      const result = ConnectAppDeviceAction.isAppOpened(application, deviceStatus, deviceModel);

      expect(result).toBe(false);
    });

    it("should return true when no constraint match the current device", () => {
      const application = {
        name: "TestApp",
        constraints: [
          {
            minVersion: "2.3.5",
            applicableModels: [DeviceModelId.NANO_S, DeviceModelId.NANO_SP],
          },
          {
            minVersion: "2.3.5",
            exemptModels: [DeviceModelId.NANO_X, DeviceModelId.NANO_SP],
          },
        ],
      } as ApplicationDependency;
      const deviceStatus = {
        currentApp: "TestApp",
        currentAppVersion: "2.3.4",
      };
      const deviceModel = DeviceModelId.NANO_X;

      const result = ConnectAppDeviceAction.isAppOpened(application, deviceStatus, deviceModel);

      expect(result).toBe(true);
    });
  });
});
