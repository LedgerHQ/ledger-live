import {
  CommandResultFactory,
  DeviceActionStatus,
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
} from "@ledgerhq/device-management-kit";
import { createDeviceManagementKit } from "../../../../../../../libs/device-onboarding/src/tests/createDeviceManagementKit";
import {
  createOsVersionResponse,
  type OsVersionResponseOptions,
} from "../../../../../../../libs/device-onboarding/src/tests/osVersionResponse";
import {
  createSessionStream,
  createTestStream,
  type SessionStream,
  type TestStream,
} from "../../../../../../../libs/device-onboarding/src/tests/testStream";
import {
  devices,
  knownStax,
  OsSlot,
  type OnboardingDevice,
  type OsSlot as OsSlotName,
} from "./deviceClass";

export { knownStax };

export type TestDevice = {
  dmk: DeviceManagementKit;
  model: OnboardingDevice;
  osVersion: string;
  cloud: string;
  latest: string;
  sessionId: string;
  setSession(sessionId: string): void;
  show(): void;
  unplug(sessionId?: string): void;
  failRead(): void;
  answerState(options: OsVersionResponseOptions): void;
  acceptToggle(): void;
  requestSecureConnection(): void;
  allowSecureConnection(): void;
  passGenuineCheck(): void;
  failGenuineCheck(): void;
  reportFirmwareUpToDate(): void;
  isWatching(sessionId: string): boolean;
};

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

export function createTestDevice(
  model: OnboardingDevice = devices.stax,
  os: OsSlotName = OsSlot.Latest,
): TestDevice {
  const osVersion = model.os(os);
  const foundDevices = createTestStream<DiscoveredDevice[]>({ current: [] });
  const sessions = new Map<string, SessionStream>();
  const commandReplies = createReplyQueue<unknown>();
  const genuineChecks: TestStream<GenuineCheckState>[] = [];
  const firmwareChecks: TestStream<FirmwareCheckState>[] = [];
  let sessionId = "session-1";
  let readFails = false;

  const dmk = createDeviceManagementKit({
    listConnectedDevices: () => [],
    listenToAvailableDevices: () => foundDevices.events,
    connect: async () => sessionId,
    getConnectedDevice: ({ sessionId: id }) => ({
      id: "device-id",
      name: model.name,
      type: model.wired ? "USB" : "BLE",
      sessionId: id,
      modelId: model.dmkModelId,
      transport: model.transport,
    }),
    getDeviceSessionState: ({ sessionId: id }) => getSession(id).events,
    sendCommand: () =>
      readFails ? Promise.reject(new Error("read failed")) : commandReplies.next(),
    executeDeviceAction: ({ deviceAction }) => {
      if (isAction(deviceAction, GenuineCheckDeviceAction)) {
        return startDeviceAction(genuineChecks);
      }
      if (isAction(deviceAction, GetDeviceMetadataDeviceAction)) {
        return startDeviceAction(firmwareChecks);
      }
      throw new Error("Unexpected device action");
    },
  });

  return {
    dmk,
    model,
    osVersion,
    cloud: model.cloud,
    latest: model.latest,
    get sessionId() {
      return sessionId;
    },
    setSession(nextId: string) {
      sessionId = nextId;
    },
    show() {
      foundDevices.push([foundDevice(model)]);
    },
    unplug(id = sessionId) {
      getSession(id).set(DeviceStatus.NOT_CONNECTED);
    },
    failRead() {
      readFails = true;
    },
    answerState(options) {
      commandReplies.push(CommandResultFactory({ data: createOsVersionResponse(options) }));
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
          firmwareVersion: { os: osVersion, mcu: "1.0.0", bootloader: "1.0.0" },
          firmwareUpdateContext: { availableUpdate: undefined },
        } as GetDeviceMetadataDAOutput,
      });
    },
    isWatching(id: string) {
      return sessions.get(id)?.watched === true;
    },
  };

  function foundDevice(device: OnboardingDevice): DiscoveredDevice {
    return {
      id: "device-id",
      name: device.name,
      transport: device.transport,
      deviceModel: {
        id: device.ledgerModelId,
        model: device.dmkModelId,
        name: device.name,
      },
    } as DiscoveredDevice;
  }

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
