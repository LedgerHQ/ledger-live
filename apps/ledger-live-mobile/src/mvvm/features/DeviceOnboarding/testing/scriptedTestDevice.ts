import {
  CommandResultFactory,
  DeviceActionStatus,
  DeviceModelId,
  DeviceStatus,
  GenuineCheckDeviceAction,
  GetDeviceMetadataDeviceAction,
  UnknownDAError,
  UserInteractionRequired,
  type DeviceActionState,
  type DeviceManagementKit,
  type DiscoveredDevice,
  type GenuineCheckDAError,
  type GenuineCheckDAIntermediateValue,
  type GenuineCheckDAOutput,
  type GetDeviceMetadataDAError,
  type GetDeviceMetadataDAIntermediateValue,
  type GetDeviceMetadataDAOutput,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import {
  createDeviceManagementKit,
  createSessionStream,
  createTestStream,
  type SessionStream,
  type TestStream,
} from "@features/platform-device-onboarding/testing";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";

const staxName = "Ledger Stax";

type OsVersionAnswer = {
  onboardingState?: string;
  numberOfWords?: number;
  currentWordIndex?: number;
  isOnboarded?: boolean;
};

function osVersionResponse({
  onboardingState,
  numberOfWords,
  currentWordIndex,
  isOnboarded = false,
}: OsVersionAnswer): GetOsVersionResponse {
  return {
    isBootloader: false,
    isOsu: false,
    seVersion: "1.4.0",
    recoveryKeyStatus: null,
    secureElementFlags: {
      isOnboarded,
      isInRecoveryMode: false,
      isSecureConnectionAllowed: false,
      onboardingState,
      numberOfWords,
      currentWordIndex,
    },
  } as unknown as GetOsVersionResponse;
}

type GenuineCheckState = DeviceActionState<
  GenuineCheckDAOutput,
  GenuineCheckDAError,
  GenuineCheckDAIntermediateValue
>;
type FirmwareCheckState = DeviceActionState<
  GetDeviceMetadataDAOutput,
  GetDeviceMetadataDAError,
  GetDeviceMetadataDAIntermediateValue
>;

export type ScriptedTestDevice = {
  dmk: DeviceManagementKit;
  readonly sessionId: string;
  setSession(sessionId: string): void;
  show(): void;
  unplug(): void;
  answerState(options: OsVersionAnswer): void;
  acceptToggle(): void;
  requestSecureConnection(): void;
  allowSecureConnection(): void;
  passGenuineCheck(): void;
  failGenuineCheck(): void;
  reportFirmwareUpToDate(): void;
  failFirmwareCheck(): void;
  isWatching(sessionId: string): boolean;
};

/** A Bluetooth Stax whose commands and checks answer only what the test queues. */
export function createScriptedTestDevice(): ScriptedTestDevice {
  const foundDevices = createTestStream<DiscoveredDevice[]>({ current: [] });
  const sessions = new Map<string, SessionStream>();
  const commandReplies = createReplyQueue<unknown>();
  const genuineChecks: TestStream<GenuineCheckState>[] = [];
  const firmwareChecks: TestStream<FirmwareCheckState>[] = [];
  let sessionId = "session-1";
  const deviceId = "device-id";

  const sendCommand = jest.fn(() => commandReplies.next());
  const executeDeviceAction = jest.fn(({ deviceAction }: { deviceAction: object }) => {
    if (isAction(deviceAction, GenuineCheckDeviceAction)) return startDeviceAction(genuineChecks);
    if (isAction(deviceAction, GetDeviceMetadataDeviceAction)) {
      return startDeviceAction(firmwareChecks);
    }
    throw new Error("Unexpected device action");
  });

  const dmk = createDeviceManagementKit({
    listConnectedDevices: () => [],
    listenToAvailableDevices: () => foundDevices.events,
    connect: () => Promise.resolve(sessionId),
    getConnectedDevice: ({ sessionId: id }) => ({
      id: deviceId,
      name: staxName,
      type: "BLE",
      sessionId: id,
      modelId: DeviceModelId.STAX,
      transport: rnBleTransportIdentifier,
    }),
    getDeviceSessionState: ({ sessionId: id }) => getSession(id).events,
    sendCommand,
    executeDeviceAction,
  });

  return {
    dmk,
    get sessionId() {
      return sessionId;
    },
    setSession(nextId: string) {
      sessionId = nextId;
    },
    show() {
      foundDevices.push([
        {
          id: deviceId,
          name: staxName,
          transport: rnBleTransportIdentifier,
          deviceModel: { id: LedgerDeviceModelId.stax, model: DeviceModelId.STAX, name: staxName },
        } as DiscoveredDevice,
      ]);
    },
    unplug() {
      getSession(sessionId).set(DeviceStatus.NOT_CONNECTED);
    },
    answerState(options) {
      commandReplies.push(CommandResultFactory({ data: osVersionResponse(options) }));
    },
    acceptToggle() {
      commandReplies.push(CommandResultFactory({ data: undefined }));
    },
    requestSecureConnection() {
      last(genuineChecks).push({
        status: DeviceActionStatus.Pending,
        intermediateValue: {
          requiredUserInteraction: UserInteractionRequired.AllowSecureConnection,
        } as GenuineCheckDAIntermediateValue,
      });
    },
    allowSecureConnection() {
      last(genuineChecks).push({
        status: DeviceActionStatus.Pending,
        intermediateValue: {
          requiredUserInteraction: UserInteractionRequired.None,
        } as GenuineCheckDAIntermediateValue,
      });
    },
    passGenuineCheck() {
      last(genuineChecks).push({
        status: DeviceActionStatus.Completed,
        output: { isGenuine: true } as GenuineCheckDAOutput,
      });
    },
    failGenuineCheck() {
      last(genuineChecks).push({
        status: DeviceActionStatus.Error,
        error: new UnknownDAError(),
      });
    },
    reportFirmwareUpToDate() {
      last(firmwareChecks).push({
        status: DeviceActionStatus.Completed,
        output: {
          firmwareVersion: { os: "1.4.0", mcu: "1.0.0", bootloader: "1.0.0" },
          firmwareUpdateContext: { availableUpdate: undefined },
        } as GetDeviceMetadataDAOutput,
      });
    },
    failFirmwareCheck() {
      last(firmwareChecks).push({
        status: DeviceActionStatus.Error,
        error: new UnknownDAError(),
      });
    },
    isWatching(id: string) {
      return sessions.get(id)?.watched === true;
    },
  };

  function getSession(id: string): SessionStream {
    const states = sessions.get(id) ?? createSessionStream();
    sessions.set(id, states);
    return states;
  }
}

function createReplyQueue<T>() {
  const replies: T[] = [];
  const waiting: Array<(reply: T) => void> = [];

  return {
    next: () =>
      replies.length > 0
        ? Promise.resolve(replies.shift() as T)
        : new Promise<T>(resolve => waiting.push(resolve)),
    push(reply: T) {
      const resolve = waiting.shift();
      if (resolve) resolve(reply);
      else replies.push(reply);
    },
  };
}

function startDeviceAction<State>(actions: TestStream<State>[]) {
  const action = createTestStream<State>();
  actions.push(action);
  return { observable: action.events, cancel: jest.fn() };
}

function last<State>(actions: TestStream<State>[]): TestStream<State> {
  const action = actions.at(-1);
  if (!action) throw new Error("The device action has not started");
  return action;
}

function isAction(
  action: object,
  expected: typeof GenuineCheckDeviceAction | typeof GetDeviceMetadataDeviceAction,
): boolean {
  return action instanceof expected || action.constructor.name === expected.name;
}
