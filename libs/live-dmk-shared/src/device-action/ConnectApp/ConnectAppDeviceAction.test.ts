import type {
  GetDeviceMetadataDAOutput,
  InstallOrUpdateAppsDAIntermediateValue,
} from "@ledgerhq/device-management-kit";
import {
  DeviceActionStatus,
  UnknownDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";

import { makeDeviceActionInternalApiMock } from "../__test-utils__/makeInternalApi";
import {
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
          // GetDerivation
          {
            intermediateValue: INSTALL_INTERMEDIATE_VALUE,
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
  });

  describe("error cases", () => {
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
});
