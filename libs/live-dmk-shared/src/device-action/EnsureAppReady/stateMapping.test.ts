import type {
  DeviceSessionState,
  GetAppAndVersionResponse,
  GetDeviceMetadataDAOutput,
  InstallPlan,
} from "@ledgerhq/device-management-kit";
import {
  AlreadySendingApduError,
  DeviceActionStatus,
  DeviceExchangeError,
  DeviceLockedError,
  DeviceModelId as DmkDeviceModelId,
  OutOfMemoryDAError,
  RefusedByUserDAError,
  UnsupportedFirmwareDAError,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { StatusCodes } from "@ledgerhq/hw-transport";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import type {
  ConnectAppDAError,
  ConnectAppDARequiredInteraction,
  ConnectAppDAState,
} from "../ConnectApp/types";
import { DeviceDeprecationError, UserInteractionRequiredLL } from "../ConnectApp/types";
import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  DeviceInteractionRequiredType,
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
} from "./state";
import {
  buildExtractedContext,
  mapConnectAppDAErrorStatus,
  mapConnectAppDAPendingStatus,
} from "./stateMapping";

const FlowName = {
  send: "send",
  receive: "receive",
  unknown: "unknown",
} as const;

const appName = "Ethereum";
const retry = jest.fn();

const currentApp: GetAppAndVersionResponse = {
  name: "Ethereum",
  version: "2.0.0",
};

const deviceMetadata = {
  firmwareVersion: {
    os: "2.1.0",
    metadata: {
      isBootloader: false,
      seVersion: "2.1.0",
      targetId: 1,
      seTargetId: 1,
      mcuSephVersion: "1.0.0",
      mcuTargetId: 1,
      seFlags: Uint8Array.from([1, 2, 3]),
      mcuBootloaderVersion: "1.0.0",
      hwVersion: "01",
      langId: 1,
    },
  },
  firmwareUpdateContext: {
    availableUpdate: {},
  },
} as unknown as GetDeviceMetadataDAOutput;

function makeInstallPlan(overrides: Partial<InstallPlan> = {}): InstallPlan {
  return {
    currentIndex: 1,
    currentProgress: 0.42,
    installPlan: [{ versionName: "Bitcoin" }, { versionName: "Ethereum" }],
    ...overrides,
  } as unknown as InstallPlan;
}

function makePending(
  requiredUserInteraction: Extract<
    ConnectAppDAState,
    { status: DeviceActionStatus.Pending }
  >["intermediateValue"]["requiredUserInteraction"],
  overrides: Partial<
    Extract<ConnectAppDAState, { status: DeviceActionStatus.Pending }>["intermediateValue"]
  > = {},
): Extract<ConnectAppDAState, { status: DeviceActionStatus.Pending }> {
  return {
    status: DeviceActionStatus.Pending,
    intermediateValue: {
      requiredUserInteraction,
      installPlan: null,
      deviceDeprecation: undefined,
      deviceMetadata: undefined,
      ...overrides,
    },
  } as unknown as Extract<ConnectAppDAState, { status: DeviceActionStatus.Pending }>;
}

function makeErrored(
  error: ConnectAppDAError,
): Extract<ConnectAppDAState, { status: DeviceActionStatus.Error }> {
  return {
    status: DeviceActionStatus.Error,
    error,
  };
}

function makeDeviceExchangeError(errorCode: string, message: string): DeviceExchangeError {
  return Object.assign(Object.create(DeviceExchangeError.prototype), {
    _tag: "DeviceExchangeError",
    errorCode,
    originalError: new Error(message),
  }) as DeviceExchangeError;
}

function makeSessionState(
  params: {
    deviceModelId?: DmkDeviceModelId;
    firmwareUpdateContext?: unknown;
  } = {},
): DeviceSessionState {
  return {
    deviceModelId: params.deviceModelId ?? DmkDeviceModelId.NANO_X,
    firmwareUpdateContext: params.firmwareUpdateContext,
  } as unknown as DeviceSessionState;
}

function makeFirmwareUpdateContext() {
  return {
    currentFirmware: {
      version: "1.0.0",
    },
    availableUpdate: {
      finalFirmware: {
        version: "2.0.0",
      },
    },
  };
}

function makeDeprecationRules(
  params: {
    warningScreenVisible?: boolean;
    clearSigningScreenVisible?: boolean;
    errorScreenVisible?: boolean;
    onContinue?: jest.Mock;
  } = {},
) {
  return {
    warningScreenVisible: params.warningScreenVisible ?? false,
    clearSigningScreenVisible: params.clearSigningScreenVisible ?? false,
    errorScreenVisible: params.errorScreenVisible ?? false,
    modelId: LedgerDeviceModelId.nanoS,
    date: new Date("2026-01-01"),
    warningScreenRules: {
      deprecatedFlow: [FlowName.send],
    },
    clearSigningScreenRules: {
      deprecatedFlow: [FlowName.send],
    },
    errorScreenRules: {
      deprecatedFlow: [FlowName.send],
    },
    onContinue: params.onContinue ?? jest.fn(),
  };
}

describe("mapConnectAppDAPendingStatus", () => {
  describe("GIVEN device interaction pending states", () => {
    it.each([
      [UserInteractionRequired.ConfirmOpenApp, DeviceInteractionRequiredType.ConfirmOpenApp],
      [
        UserInteractionRequired.AllowSecureConnection,
        DeviceInteractionRequiredType.AllowSecureConnection,
      ],
      [UserInteractionRequired.AllowListApps, DeviceInteractionRequiredType.AllowSecureConnection],
      [UserInteractionRequired.UnlockDevice, DeviceInteractionRequiredType.UnlockDevice],
    ])("WHEN %s is required THEN it maps to %s", (requiredUserInteraction, expectedType) => {
      // GIVEN
      const state = makePending(requiredUserInteraction as ConnectAppDARequiredInteraction);

      // WHEN
      const result = mapConnectAppDAPendingStatus({
        state,
        appName,
        deprecationDismissedCurrencyNames: [],
      });

      // THEN
      expect(result).toEqual({ type: expectedType });
    });
  });

  describe("GIVEN no user interaction is required", () => {
    it("WHEN there is no install plan THEN it returns null", () => {
      // GIVEN
      const state = makePending(UserInteractionRequired.None);

      // WHEN
      const result = mapConnectAppDAPendingStatus({
        state,
        appName,
        deprecationDismissedCurrencyNames: [],
      });

      // THEN
      expect(result).toBeNull();
    });

    it("WHEN there is an install plan THEN it maps install progress", () => {
      // GIVEN
      const state = makePending(UserInteractionRequired.None, {
        installPlan: makeInstallPlan(),
      });

      // WHEN
      const result = mapConnectAppDAPendingStatus({
        state,
        appName,
        deprecationDismissedCurrencyNames: [],
      });

      // THEN
      expect(result).toEqual({
        type: LoadingStateType.InstallingApp,
        appName: "Ethereum",
        progress: 0.42,
        index: 1,
        total: 2,
      });
    });

    it("WHEN the current install entry is missing THEN it falls back to the requested app name", () => {
      // GIVEN
      const state = makePending(UserInteractionRequired.None, {
        installPlan: makeInstallPlan({
          currentIndex: 99,
        }),
      });

      // WHEN
      const result = mapConnectAppDAPendingStatus({
        state,
        appName,
        deprecationDismissedCurrencyNames: [],
      });

      // THEN
      expect(result).toEqual(
        expect.objectContaining({
          type: LoadingStateType.InstallingApp,
          appName: "Ethereum",
        }),
      );
    });
  });

  describe("GIVEN a deprecation pending state", () => {
    it("WHEN there are no deprecation rules THEN it returns null", () => {
      // GIVEN
      const state = makePending(UserInteractionRequiredLL.DeviceDeprecation);

      // WHEN
      const result = mapConnectAppDAPendingStatus({
        state,
        appName,
        deprecationDismissedCurrencyNames: [],
      });

      // THEN
      expect(result).toBeNull();
    });

    it("WHEN there is no deprecation input THEN it returns null", () => {
      // GIVEN
      const state = makePending(UserInteractionRequiredLL.DeviceDeprecation, {
        deviceDeprecation: makeDeprecationRules({
          warningScreenVisible: true,
        }),
      });

      // WHEN
      const result = mapConnectAppDAPendingStatus({
        state,
        appName,
        deprecationDismissedCurrencyNames: [],
      });

      // THEN
      expect(result).toBeNull();
    });

    it("WHEN the deprecation decision is skipped THEN it resumes and returns null", () => {
      // GIVEN
      const onContinue = jest.fn();
      const state = makePending(UserInteractionRequiredLL.DeviceDeprecation, {
        deviceDeprecation: makeDeprecationRules({
          warningScreenVisible: true,
          onContinue,
        }),
      });

      // WHEN
      const result = mapConnectAppDAPendingStatus({
        state,
        appName,
        deprecation: {
          flow: FlowName.send,
          currencyName: "Ethereum",
        },
        deprecationDismissedCurrencyNames: ["Ethereum"],
      });

      // THEN
      expect(result).toBeNull();
      expect(onContinue).toHaveBeenCalledWith(false);
    });

    it("WHEN the deprecation decision should be shown THEN it returns a non-blocking state", () => {
      // GIVEN
      const onContinue = jest.fn();
      const state = makePending(UserInteractionRequiredLL.DeviceDeprecation, {
        deviceDeprecation: makeDeprecationRules({
          warningScreenVisible: true,
          onContinue,
        }),
      });

      // WHEN
      const result = mapConnectAppDAPendingStatus({
        state,
        appName,
        deprecation: {
          flow: FlowName.send,
          currencyName: "Ethereum",
        },
        deprecationDismissedCurrencyNames: [],
      });

      // THEN
      expect(result).toMatchObject({
        type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking,
        decision: {
          status: "show",
          currencyName: "Ethereum",
          deviceModelId: LedgerDeviceModelId.nanoS,
        },
      });

      if (!result || result.type !== AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking) {
        throw new Error("Expected a non-blocking deprecation state");
      }
      result.onContinue();
      expect(onContinue).toHaveBeenCalledWith(false);
    });

    it("WHEN the deprecation decision blocks THEN it resumes with an error and returns a blocking state", () => {
      // GIVEN
      const onContinue = jest.fn();
      const state = makePending(UserInteractionRequiredLL.DeviceDeprecation, {
        deviceDeprecation: makeDeprecationRules({
          errorScreenVisible: true,
          onContinue,
        }),
      });

      // WHEN
      const result = mapConnectAppDAPendingStatus({
        state,
        appName,
        deprecation: {
          flow: FlowName.send,
          currencyName: "Ethereum",
        },
        deprecationDismissedCurrencyNames: [],
      });

      // THEN
      expect(result).toMatchObject({
        type: BlockingStateType.DeviceDeprecatedBlocking,
        decision: {
          status: "block",
          currencyName: "Ethereum",
          deviceModelId: LedgerDeviceModelId.nanoS,
        },
      });
      expect(onContinue).toHaveBeenCalledWith(true);
    });
  });

  describe("GIVEN an unknown pending interaction", () => {
    it("WHEN it is mapped THEN it throws", () => {
      // GIVEN
      const state = makePending("unknown-interaction" as never);

      // WHEN / THEN
      expect(() =>
        mapConnectAppDAPendingStatus({
          state,
          appName,
          deprecationDismissedCurrencyNames: [],
        }),
      ).toThrow("Unhandled value: unknown-interaction");
    });
  });
});

describe("mapConnectAppDAErrorStatus", () => {
  it("GIVEN an out-of-memory error with an install plan WHEN it is mapped THEN it uses install plan app names", () => {
    // GIVEN
    const getCurrentDeviceState = jest.fn(() => makeSessionState());

    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(new OutOfMemoryDAError()),
      appName,
      getCurrentDeviceState,
      latestInstallPlan: makeInstallPlan(),
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: BlockingStateType.DeviceOutOfStorageSpace,
      appNames: ["Bitcoin", "Ethereum"],
    });
    expect(getCurrentDeviceState).not.toHaveBeenCalled();
  });

  it("GIVEN an out-of-memory error without an install plan WHEN it is mapped THEN it uses the requested app name", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(new OutOfMemoryDAError()),
      appName,
      getCurrentDeviceState: jest.fn(() => makeSessionState()),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: BlockingStateType.DeviceOutOfStorageSpace,
      appNames: ["Ethereum"],
    });
  });

  it("GIVEN an unsupported firmware error with update info WHEN it is mapped THEN it includes update info", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(new UnsupportedFirmwareDAError()),
      appName,
      getCurrentDeviceState: jest.fn(() =>
        makeSessionState({
          firmwareUpdateContext: makeFirmwareUpdateContext(),
        }),
      ),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: BlockingStateType.UnsupportedFirmwareVersion,
      updateInfo: {
        currentVersion: "1.0.0",
        latestVersion: "2.0.0",
      },
    });
  });

  it("GIVEN an unsupported firmware error without update info WHEN it is mapped THEN update info is omitted", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(new UnsupportedFirmwareDAError()),
      appName,
      getCurrentDeviceState: jest.fn(() => makeSessionState()),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: BlockingStateType.UnsupportedFirmwareVersion,
      updateInfo: undefined,
    });
  });

  it("GIVEN an unsupported app error on Nano S WHEN it is mapped THEN it returns unsupported application", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored({ _tag: "UnsupportedApplicationDAError" } as ConnectAppDAError),
      appName,
      getCurrentDeviceState: jest.fn(() =>
        makeSessionState({
          deviceModelId: DmkDeviceModelId.NANO_S,
        }),
      ),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: BlockingStateType.UnsupportedApplication,
      appName: "Ethereum",
      deviceModelId: LedgerDeviceModelId.nanoS,
    });
  });

  it("GIVEN an unsupported app error on another device WHEN it is mapped THEN it returns unsupported feature", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored({ _tag: "UnsupportedApplicationDAError" } as ConnectAppDAError),
      appName,
      getCurrentDeviceState: jest.fn(() =>
        makeSessionState({
          deviceModelId: DmkDeviceModelId.NANO_X,
        }),
      ),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: BlockingStateType.UnsupportedFeature,
      deviceModelId: LedgerDeviceModelId.nanoX,
    });
  });

  it("GIVEN a device deprecation error WHEN it is mapped THEN it returns null", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(new DeviceDeprecationError()),
      appName,
      getCurrentDeviceState: jest.fn(() => makeSessionState()),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toBeNull();
  });

  it("GIVEN a device-not-onboarded error WHEN it is mapped THEN it returns a blocking not-onboarded state", () => {
    // GIVEN
    const getCurrentDeviceState = jest.fn(() => makeSessionState());

    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored({ _tag: "DeviceNotOnboardedError" } as ConnectAppDAError),
      appName,
      getCurrentDeviceState,
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: BlockingStateType.DeviceNotOnboarded,
    });
    expect(getCurrentDeviceState).not.toHaveBeenCalled();
  });

  it("GIVEN a locked device error WHEN it is mapped THEN it returns a retryable locked state", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(new DeviceLockedError()),
      appName,
      getCurrentDeviceState: jest.fn(() => makeSessionState()),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: RetryableStateType.DeviceLocked,
      retry,
    });
  });

  it("GIVEN a legacy LedgerJS locked device error shape WHEN it is mapped THEN it returns a retryable locked state", () => {
    const legacyLockedDeviceError = Object.assign(new Error("Ledger device: Locked device (0x5515)"), {
      name: "LockedDeviceError",
      statusCode: StatusCodes.LOCKED_DEVICE,
      statusText: "LOCKED_DEVICE",
    }) as unknown as ConnectAppDAError;

    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(legacyLockedDeviceError),
      appName,
      getCurrentDeviceState: jest.fn(() => makeSessionState()),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: RetryableStateType.DeviceLocked,
      retry,
    });
  });

  it("GIVEN an already-sending-apdu error WHEN it is mapped THEN it returns a retryable busy state", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(new AlreadySendingApduError() as unknown as ConnectAppDAError),
      appName,
      getCurrentDeviceState: jest.fn(() => makeSessionState()),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: RetryableStateType.DeviceBusy,
      retry,
    });
  });

  it("GIVEN a refused-by-user error WHEN it is mapped THEN it returns a retryable refused state", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(new RefusedByUserDAError()),
      appName,
      getCurrentDeviceState: jest.fn(() => makeSessionState()),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: RetryableStateType.UserRefusedOnDevice,
      retry,
    });
  });

  it("GIVEN a 5501 device exchange error WHEN it is mapped THEN it returns a retryable refused state", () => {
    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(makeDeviceExchangeError("5501", "refused")),
      appName,
      getCurrentDeviceState: jest.fn(() => makeSessionState()),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: RetryableStateType.UserRefusedOnDevice,
      retry,
    });
  });

  it("GIVEN an unmapped error WHEN it is mapped THEN it returns a final error state", () => {
    // GIVEN
    const error = makeDeviceExchangeError("6a80", "unmapped");

    // WHEN
    const result = mapConnectAppDAErrorStatus({
      state: makeErrored(error),
      appName,
      getCurrentDeviceState: jest.fn(() => makeSessionState()),
      latestInstallPlan: null,
      retry,
    });

    // THEN
    expect(result).toEqual({
      type: FinalStateType.Error,
      error,
    });
  });
});

describe("buildExtractedContext", () => {
  it("GIVEN device metadata WHEN the context is built THEN it extracts OS, app, update and derivation data", () => {
    // WHEN
    const result = buildExtractedContext({
      deviceMetadata,
      currentApp,
      derivation: "0xderived",
    });

    // THEN
    expect(result).toEqual({
      currentOsVersion: "2.1.0",
      osUpdateAvailable: true,
      currentAppName: "Ethereum",
      currentAppVersion: "2.0.0",
      derivedAddress: "0xderived",
    });
  });

  it("GIVEN no device metadata WHEN the context is built THEN it falls back to unknown OS information", () => {
    // WHEN
    const result = buildExtractedContext({
      deviceMetadata: undefined,
      currentApp,
      derivation: undefined,
    });

    // THEN
    expect(result).toEqual({
      currentOsVersion: "unknown",
      osUpdateAvailable: false,
      currentAppName: "Ethereum",
      currentAppVersion: "2.0.0",
      derivedAddress: undefined,
    });
  });
});
