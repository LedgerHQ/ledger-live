import type {
  ApplicationDependency,
  GetDeviceMetadataDAOutput,
  InstallOrUpdateAppsDAIntermediateValue,
  OpenAppWithDependenciesDAIntermediateValue,
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
  setupGetDeviceStatusSequenceMock,
  setupGetDeviceMetadataMock,
  setupInstallOrUpdateAppsMock,
  setupOpenAppWithDependenciesMock,
} from "../__test-utils__/setupTestMachine";
import {
  testDeviceActionStates,
  testDeviceActionStatesWithUI,
} from "../__test-utils__/testDeviceActionStates";

import { ConnectAppDeviceAction } from "./ConnectAppDeviceAction";
import {
  UserInteractionRequiredLL,
  type ConnectAppDAIntermediateValue,
  type ConnectAppDAState,
  type DeviceDeprecationConfigs,
  type DeviceDeprecationConfig,
} from "./types";
import { isDeviceDeprecated } from "./deprecation";

jest.mock("@ledgerhq/device-management-kit", () => {
  const original = jest.requireActual<typeof import("@ledgerhq/device-management-kit")>(
    "@ledgerhq/device-management-kit",
  );
  return {
    ...original,
    GetDeviceStatusDeviceAction: jest.fn(() => ({
      makeStateMachine: jest.fn(),
    })),
    GetDeviceMetadataDeviceAction: jest.fn(() => ({
      makeStateMachine: jest.fn(),
    })),
    InstallOrUpdateAppsDeviceAction: jest.fn(() => ({
      makeStateMachine: jest.fn(),
    })),
    OpenAppWithDependenciesDeviceAction: jest.fn(() => ({
      makeStateMachine: jest.fn(),
    })),
  };
});

describe("OpenAppWithDependenciesDeviceAction", () => {
  const apiMock = makeDeviceActionInternalApiMock();

  const DEVICE_STATUS_ETHEREUM = {
    currentApp: "Ethereum",
    currentAppVersion: "3.4.5",
  };
  const DEVICE_STATUS_BOLOS = {
    currentApp: "BOLOS",
    currentAppVersion: "0.0.0",
  };
  const CURRENT_APP = {
    name: "Ethereum",
    version: "3.4.5",
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
  } as InstallOrUpdateAppsDAIntermediateValue;

  const INSTALL_RESULT = {
    successfullyInstalled: [{ versionName: "1inch" }] as any[],
    alreadyInstalled: ["Ethereum", "Uniswap"],
    missingApplications: [""],
  };

  const OPEN_APP_RESULT = {
    deviceMetadata: DEVICE_METADATA,
    installResult: INSTALL_RESULT,
  };

  const OPEN_APP_INTERMEDIATE_VALUE: OpenAppWithDependenciesDAIntermediateValue = {
    ...INSTALL_INTERMEDIATE_VALUE,
    step: "os.openAppWithDependencies.steps.installOrUpdateApps",
  };

  const DEFAULT_INTERMEDIATE_VALUE: ConnectAppDAIntermediateValue = {
    requiredUserInteraction: UserInteractionRequired.None,
    installPlan: null,
    deviceDeprecation: undefined,
    deviceMetadata: undefined,
  };

  const DEFAULT_INTERMEDIATE_VALUE_WITH_METADATA: ConnectAppDAIntermediateValue = {
    ...DEFAULT_INTERMEDIATE_VALUE,
    deviceMetadata: DEVICE_METADATA,
  };

  const INSTALL_INTERMEDIATE_VALUE_WITH_METADATA: ConnectAppDAIntermediateValue = {
    ...INSTALL_INTERMEDIATE_VALUE,
    deviceDeprecation: undefined,
    deviceMetadata: DEVICE_METADATA,
  };
  const REFRESH_DEVICE_STATUS_PENDING = {
    intermediateValue: expect.objectContaining({
      installPlan: null,
    }),
    status: DeviceActionStatus.Pending,
  } as unknown as ConnectAppDAState;

  beforeEach(() => {
    jest.clearAllMocks();
    apiMock.getDeviceSessionState.mockReturnValue({
      deviceModelId: DeviceModelId.NANO_X,
    } as unknown as DeviceSessionState);
  });

  describe("success cases", () => {
    it("Connect app from dashboard", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupInstallOrUpdateAppsMock(INSTALL_RESULT, INSTALL_INTERMEDIATE_VALUE);
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "BOLOS" },
            dependencies: [{ name: "Ethereum" }, { name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceStatus
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDeviceMetadata
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // OpenAppWithDependencies
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          // RefreshDeviceStatus
          REFRESH_DEVICE_STATUS_PENDING,
          REFRESH_DEVICE_STATUS_PENDING,
          // Success
          {
            output: expect.objectContaining({
              deviceMetadata: DEVICE_METADATA,
              installResult: INSTALL_RESULT,
              currentApp: CURRENT_APP,
            }),
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("exposes device metadata in the intermediate value after fetching it", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, OPEN_APP_INTERMEDIATE_VALUE);
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);

        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [{ name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const observedStates: Array<ConnectAppDAState> = [];
        const { observable } = deviceAction._execute(apiMock);

        observable.subscribe({
          next: state => {
            observedStates.push(state);
          },
          error: reject,
          complete: () => {
            try {
              expect(observedStates).toContainEqual(
                expect.objectContaining({
                  status: DeviceActionStatus.Pending,
                  intermediateValue: expect.objectContaining({
                    installPlan: null,
                    deviceMetadata: DEVICE_METADATA,
                  }),
                }),
              );
              expect(observedStates).toContainEqual(
                expect.objectContaining({
                  status: DeviceActionStatus.Pending,
                  intermediateValue: expect.objectContaining({
                    installPlan: INSTALL_INTERMEDIATE_VALUE.installPlan,
                    deviceMetadata: DEVICE_METADATA,
                  }),
                }),
              );
              resolve();
            } catch (error) {
              reject(error);
            }
          },
        });
      }));

    it("Connect app without derivation", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, OPEN_APP_INTERMEDIATE_VALUE);
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [{ name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceStatus
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDeviceMetadata
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // InstallOrUpdateApps
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          // RefreshDeviceStatus
          REFRESH_DEVICE_STATUS_PENDING,
          REFRESH_DEVICE_STATUS_PENDING,
          // Success
          {
            output: expect.objectContaining({
              deviceMetadata: DEVICE_METADATA,
              installResult: INSTALL_RESULT,
              currentApp: CURRENT_APP,
            }),
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
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, OPEN_APP_INTERMEDIATE_VALUE);
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);
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
          // GetDeviceStatus
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDeviceMetadata
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // InstallOrUpdateApps
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          // GetDerivation
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          // RefreshDeviceStatus
          REFRESH_DEVICE_STATUS_PENDING,
          REFRESH_DEVICE_STATUS_PENDING,
          // Success
          {
            output: expect.objectContaining({
              deviceMetadata: DEVICE_METADATA,
              installResult: INSTALL_RESULT,
              derivation: "eth-address",
              currentApp: CURRENT_APP,
            }),
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
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);
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
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // Success
          {
            output: expect.objectContaining({
              currentApp: CURRENT_APP,
            }),
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
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);
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
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDerivation
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // RefreshDeviceStatus
          REFRESH_DEVICE_STATUS_PENDING,
          REFRESH_DEVICE_STATUS_PENDING,
          // Success
          {
            output: expect.objectContaining({
              derivation: "eth-address",
              currentApp: CURRENT_APP,
            }),
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
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, OPEN_APP_INTERMEDIATE_VALUE);
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
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDeviceMetadata
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // InstallOrUpdateApps
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          // RefreshDeviceStatus
          REFRESH_DEVICE_STATUS_PENDING,
          REFRESH_DEVICE_STATUS_PENDING,
          // Success
          {
            output: expect.objectContaining({
              deviceMetadata: DEVICE_METADATA,
              installResult: INSTALL_RESULT,
              currentApp: CURRENT_APP,
            }),
            status: DeviceActionStatus.Completed,
          },
        ];

        testDeviceActionStates(deviceAction, expectedStates, apiMock, {
          onDone: resolve,
          onError: reject,
        });
      }));

    it("uses the refreshed device status in the final output after opening the requested app", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceStatusSequenceMock([DEVICE_STATUS_BOLOS, DEVICE_STATUS_ETHEREUM]);
        setupGetDeviceMetadataMock(DEVICE_METADATA);
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, OPEN_APP_INTERMEDIATE_VALUE);

        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const observedStates: Array<ConnectAppDAState> = [];
        const { observable } = deviceAction._execute(apiMock);

        observable.subscribe({
          next: state => {
            observedStates.push(state);
          },
          error: reject,
          complete: () => {
            try {
              expect(observedStates[observedStates.length - 1]).toEqual(
                expect.objectContaining({
                  status: DeviceActionStatus.Completed,
                  output: expect.objectContaining({
                    currentApp: CURRENT_APP,
                  }),
                }),
              );
              expect(observedStates[observedStates.length - 1]).not.toEqual(
                expect.objectContaining({
                  output: expect.objectContaining({
                    currentApp: {
                      name: DEVICE_STATUS_BOLOS.currentApp,
                      version: DEVICE_STATUS_BOLOS.currentAppVersion,
                    },
                  }),
                }),
              );
              resolve();
            } catch (error) {
              reject(error);
            }
          },
        });
      }));
  });

  describe("error cases", () => {
    it("Get device status error", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM, true);

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
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
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
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "BOLOS" },
            dependencies: [{ name: "Ethereum" }, { name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceStatus
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDeviceMetadata
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
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
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);
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
          // GetDeviceStatus
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDeviceMetadata
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // InstallOrUpdateApps
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE_WITH_METADATA,
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
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, OPEN_APP_INTERMEDIATE_VALUE, true);
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);

        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [{ name: "Uniswap" }, { name: "1inch" }],
            requireLatestFirmware: false,
            allowMissingApplication: false,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          // GetDeviceStatus
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDeviceMetadata
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // OpenAppWithDependencies
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE_WITH_METADATA,
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
        setupOpenAppWithDependenciesMock(OPEN_APP_RESULT, OPEN_APP_INTERMEDIATE_VALUE);
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);

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
          // GetDeviceStatus
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // GetDeviceMetadata
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
            status: DeviceActionStatus.Pending,
          },
          // OpenAppWithDependencies
          {
            intermediateValue: DEFAULT_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE_WITH_METADATA,
            status: DeviceActionStatus.Pending,
          },
          // GetDerivation
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE_WITH_METADATA,
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

  describe("test device deprecation", () => {
    const MODEL: DeviceModelId = DeviceModelId.NANO_S;

    const PAST = "2000-01-01";
    const FUTURE = "2999-01-01";

    const baseEntry = (over: Partial<DeviceDeprecationConfig> = {}): DeviceDeprecationConfig => ({
      deviceModelId: "nanoS",
      warningScreen: { date: FUTURE, deprecatedFlow: [] },
      errorScreen: { date: FUTURE, deprecatedFlow: [] },
      warningClearSigningScreen: { date: FUTURE, deprecatedFlow: [], exception: [] },
      ...over,
    });

    const INFO_PAST_CONFIG: DeviceDeprecationConfigs = [
      {
        deviceModelId: MODEL,
        warningScreen: { date: PAST, deprecatedFlow: ["receive"] },
        errorScreen: { date: FUTURE, deprecatedFlow: [] },
        warningClearSigningScreen: { date: FUTURE, deprecatedFlow: [], exception: [] },
      },
    ];

    const ERROR_PAST_CONFIG: DeviceDeprecationConfigs = [
      {
        deviceModelId: MODEL,
        warningScreen: { date: FUTURE, deprecatedFlow: [] },
        errorScreen: { date: PAST, deprecatedFlow: ["receive"] },
        warningClearSigningScreen: { date: FUTURE, deprecatedFlow: [], exception: [] },
      },
    ];

    const PENDING_NONE: ConnectAppDAState = {
      status: DeviceActionStatus.Pending,
      intermediateValue: DEFAULT_INTERMEDIATE_VALUE,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      apiMock.getDeviceSessionState.mockReturnValue({
        deviceModelId: DeviceModelId.NANO_S,
      } as unknown as DeviceSessionState);
    });

    it("sets warning visible when infoScreen date is past", () => {
      const cfg: DeviceDeprecationConfigs = [
        baseEntry({ warningScreen: { date: PAST, deprecatedFlow: ["receive"] } }),
      ];
      const res = isDeviceDeprecated(cfg, MODEL);
      expect(res.warningScreenVisible).toBe(true);
      expect(res.warningScreenRules).toEqual({ exception: [], deprecatedFlow: ["receive"] });
      expect(res.errorScreenVisible).toBe(false);
      expect(res.clearSigningScreenVisible).toBe(false);
    });

    it("sets error visible and date = errorDate when errorScreen is past", () => {
      const cfg: DeviceDeprecationConfigs = [
        baseEntry({ errorScreen: { date: PAST, deprecatedFlow: ["receive"], exception: ["X"] } }),
      ];
      const res = isDeviceDeprecated(cfg, MODEL);
      expect(res.errorScreenVisible).toBe(true);
      expect(res.errorScreenRules).toEqual({ exception: ["X"], deprecatedFlow: ["receive"] });
      expect(res.date.toISOString().startsWith("2000-01-01")).toBe(true);
    });

    it("sets clearSigning visible when warningClearSigningScreen is past", () => {
      const cfg: DeviceDeprecationConfigs = [
        baseEntry({
          warningClearSigningScreen: {
            date: PAST,
            deprecatedFlow: ["receive"],
            exception: ["A", "B"],
          },
        }),
      ];
      const res = isDeviceDeprecated(cfg, MODEL);
      expect(res.clearSigningScreenVisible).toBe(true);
      expect(res.clearSigningScreenRules).toEqual({
        exception: ["A", "B"],
        deprecatedFlow: ["receive"],
      });
    });

    it("does not set visible flags when all dates are future", () => {
      const cfg: DeviceDeprecationConfigs = [baseEntry()];
      const res = isDeviceDeprecated(cfg, MODEL);
      expect(res.warningScreenVisible).toBe(false);
      expect(res.errorScreenVisible).toBe(false);
      expect(res.clearSigningScreenVisible).toBe(false);
    });

    it("mix: error future, info past, clear future → only warning visible, date stays errorDate or now", () => {
      const cfg: DeviceDeprecationConfigs = [
        baseEntry({
          errorScreen: { date: FUTURE, deprecatedFlow: [] },
          warningScreen: { date: PAST, deprecatedFlow: [] },
          warningClearSigningScreen: { date: FUTURE, deprecatedFlow: [], exception: [] },
        }),
      ];
      const res = isDeviceDeprecated(cfg, MODEL);
      expect(res.warningScreenVisible).toBe(true);
      expect(res.errorScreenVisible).toBe(false);
      expect(res.clearSigningScreenVisible).toBe(false);
      expect(res.date instanceof Date).toBe(true);
    });

    it("Deprecation flow (info screen past) → user continues → success", () =>
      new Promise<void>((resolve, reject) => {
        setupGetDeviceStatusMock(DEVICE_STATUS_ETHEREUM);

        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [],
            requireLatestFirmware: false,
            allowMissingApplication: false,
            deprecationConfig: INFO_PAST_CONFIG,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          PENDING_NONE,
          PENDING_NONE,
          PENDING_NONE,
          expect.objectContaining({
            status: DeviceActionStatus.Pending,
            intermediateValue: expect.objectContaining({
              requiredUserInteraction: UserInteractionRequiredLL.DeviceDeprecation,
              deviceDeprecation: expect.objectContaining({
                warningScreenVisible: true,
                errorScreenVisible: false,
                clearSigningScreenVisible: false,
                date: expect.any(Date),
                modelId: expect.anything(),
              }),
            }),
          }) as any,
          {
            status: DeviceActionStatus.Completed,
            output: expect.objectContaining({
              currentApp: CURRENT_APP,
            }),
          } as unknown,
        ];

        testDeviceActionStatesWithUI(deviceAction, expectedStates, apiMock, {
          onEach: s => {
            if (
              s.status === DeviceActionStatus.Pending &&
              s.intermediateValue?.requiredUserInteraction ===
                UserInteractionRequiredLL.DeviceDeprecation &&
              s.intermediateValue?.deviceDeprecation
            ) {
              expect(s.intermediateValue.deviceDeprecation.warningScreenVisible).toBe(true);
              expect(s.intermediateValue.deviceDeprecation.errorScreenVisible).toBe(false);
              expect(s.intermediateValue.deviceDeprecation.clearSigningScreenVisible).toBe(false);

              s.intermediateValue.deviceDeprecation.onContinue(false);
            }
          },
          onDone: resolve,
          onError: reject,
        });
      }));

    it("Deprecation flow (error screen past) → user aborts → error", () =>
      new Promise<void>((resolve, reject) => {
        const deviceAction = new ConnectAppDeviceAction({
          input: {
            application: { name: "Ethereum" },
            dependencies: [],
            requireLatestFirmware: false,
            allowMissingApplication: false,
            deprecationConfig: ERROR_PAST_CONFIG,
          },
        });

        const expectedStates: Array<ConnectAppDAState> = [
          PENDING_NONE,
          PENDING_NONE,
          PENDING_NONE,
          expect.objectContaining({
            status: DeviceActionStatus.Pending,
            intermediateValue: expect.objectContaining({
              requiredUserInteraction: UserInteractionRequiredLL.DeviceDeprecation,
              deviceDeprecation: expect.objectContaining({
                errorScreenVisible: true,
                date: expect.any(Date),
                modelId: expect.anything(),
              }),
            }),
          }) as any,
          {
            status: DeviceActionStatus.Error,
            error: expect.objectContaining({
              _tag: "DeviceDeprecationError",
              message: "device-deprecation",
            }) as any,
          } as any,
        ];

        testDeviceActionStatesWithUI(deviceAction, expectedStates, apiMock, {
          onEach: s => {
            if (
              s.status === DeviceActionStatus.Pending &&
              s.intermediateValue?.requiredUserInteraction ===
                UserInteractionRequiredLL.DeviceDeprecation &&
              s.intermediateValue?.deviceDeprecation
            ) {
              expect(s.intermediateValue.deviceDeprecation.errorScreenVisible).toBe(true);
              s.intermediateValue.deviceDeprecation.onContinue(true);
            }
          },
          onDone: resolve,
          onError: reject,
        });
      }));
  });
});
