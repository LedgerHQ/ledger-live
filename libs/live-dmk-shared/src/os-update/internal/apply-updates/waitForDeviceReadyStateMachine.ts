import {
  GetOsVersionCommand,
  isSuccessCommandResult,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DeviceSessionId,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { assign, fromCallback, fromPromise, setup } from "xstate";
import {
  DEVICE_CALL_TIMEOUT_MS,
  DISCOVERY_TIMEOUT_MS,
  POLL_INTERVAL_MS,
} from "../shared/constants";
import { isDeviceDisconnectedError } from "../shared/utils/isDeviceDisconnectedError";
import { REBOOT_SETTLE_DELAY_MS } from "./constants";
import {
  WaitForDeviceReadyEventType,
  type WaitForDeviceReadyContext,
  type WaitForDeviceReadyEvent,
  type WaitForDeviceReadyInput,
  type WaitForDeviceReadyOutput,
  type WaitForDeviceReadyStateMachine,
} from "./types";
import { isTargetReached } from "./utils/isTargetReached";
import { matchesRebootedDevice } from "../shared/utils/matchesRebootedDevice";

/** The device to reopen the session on, which discovery replaced when the reboot moved it. */
const deviceToConnect = (context: WaitForDeviceReadyContext) => ({
  ...context.rediscoveredDevice!,
  sessionId: context.connectedDevice.sessionId,
});

/**
 * Waits out the reboot a device action leaves behind. The device action completes before the device
 * restarts, so the session that is still open is already dead. Tear it down, find the device again
 * and reopen the session under the id the caller holds. Only then does a `GetOsVersion` decide whether
 * the expected state has been reached.
 */
export const waitForDeviceReadyStateMachine: WaitForDeviceReadyStateMachine = setup({
  types: {
    input: {} as WaitForDeviceReadyInput,
    context: {} as WaitForDeviceReadyContext,
    events: {} as WaitForDeviceReadyEvent,
    output: {} as WaitForDeviceReadyOutput,
  },
  actors: {
    getOsVersion: fromPromise(
      ({ input }: { input: { dmk: DeviceManagementKit; sessionId: DeviceSessionId } }) =>
        input.dmk.sendCommand({
          sessionId: input.sessionId,
          command: new GetOsVersionCommand(),
        }),
    ),
    // Frees the id the reconnection reuses, and ends the reconnection window the transport may
    // still be in. It throws once DMK has dropped the session, which means the job is done.
    disconnect: fromPromise(
      async ({
        input,
      }: {
        input: { dmk: DeviceManagementKit; sessionId: DeviceSessionId };
      }): Promise<void> => {
        try {
          await input.dmk.disconnect({ sessionId: input.sessionId });
        } catch {
          /* empty */
        }
      },
    ),
    // A reboot leaves the device unreachable under the id it was connected with, on either
    // transport: BLE comes back under a new address, and USB re-enumerates under a new uid. Both
    // have to be found again, on the terms `matchesRebootedDevice` sets out.
    discoverDevice: fromCallback<
      WaitForDeviceReadyEvent,
      { dmk: DeviceManagementKit; connectedDevice: ConnectedDevice }
    >(({ input, sendBack }) => {
      const subscription = input.dmk
        .listenToAvailableDevices({ transport: input.connectedDevice.transport })
        .subscribe({
          next: devices => {
            const match = devices.find(device =>
              matchesRebootedDevice(input.connectedDevice, device),
            );
            if (match) {
              sendBack({ type: WaitForDeviceReadyEventType.DEVICE_FOUND, device: match });
            }
          },
          error: () => undefined,
        });
      return () => {
        subscription.unsubscribe();
        void input.dmk.stopDiscovering();
      };
    }),
    // Reopens the session under the id it already had. `ConnectUseCase` takes the transport device
    // from `device.id` and the session id from `device.sessionId`, independently, so a device
    // rediscovered under a new address or uid still lands on the session the caller holds.
    connect: fromPromise(
      async ({
        input,
      }: {
        input: {
          dmk: DeviceManagementKit;
          device: DiscoveredDevice & { sessionId: DeviceSessionId };
        };
      }): Promise<ConnectedDevice> => {
        const sessionId = await input.dmk.connect({
          device: input.device,
          sessionRefresherOptions: { isRefresherDisabled: true },
        });
        return input.dmk.getConnectedDevice({ sessionId });
      },
    ),
  },
  delays: {
    rebootSettleDelay: REBOOT_SETTLE_DELAY_MS,
    poll: POLL_INTERVAL_MS,
    deviceCallTimeout: DEVICE_CALL_TIMEOUT_MS,
    discoveryTimeout: DISCOVERY_TIMEOUT_MS,
  },
}).createMachine({
  id: "waitForDeviceReady",
  context: ({ input }) => ({
    ...input,
    osVersion: null,
    rediscoveredDevice: null,
  }),
  initial: "Settling",
  states: {
    // Reading straight away would answer with the state the device held before it restarted, and
    // would leave the transport retrying the address that no longer exists. Wait the reboot out,
    // then drop the session and find the device again.
    Settling: {
      after: {
        rebootSettleDelay: "Reconnecting",
      },
    },
    // Tear down, rediscover, reconnect under the same session id. A failure at any point starts
    // another discovery pass rather than probing the session that was just closed.
    Reconnecting: {
      entry: assign({ rediscoveredDevice: null }),
      initial: "TearingDown",
      states: {
        TearingDown: {
          invoke: {
            src: "disconnect",
            input: ({ context }) => ({
              dmk: context.dmk,
              sessionId: context.connectedDevice.sessionId,
            }),
            onDone: "Discovering",
          },
          // Bounded because the React Native HID transport hops the native bridge and can leave the
          // disconnection unconfirmed. Discovering again beats waiting forever.
          after: {
            deviceCallTimeout: "Discovering",
          },
        },
        Discovering: {
          invoke: {
            src: "discoverDevice",
            input: ({ context }) => ({
              dmk: context.dmk,
              connectedDevice: context.connectedDevice,
            }),
          },
          on: {
            [WaitForDeviceReadyEventType.DEVICE_FOUND]: {
              actions: assign({ rediscoveredDevice: ({ event }) => event.device }),
              target: "Connecting",
            },
          },
          after: {
            discoveryTimeout: "AwaitingDiscoveryRetry",
          },
        },
        AwaitingDiscoveryRetry: {
          after: {
            poll: "Discovering",
          },
        },
        Connecting: {
          invoke: {
            src: "connect",
            input: ({ context }) => ({
              dmk: context.dmk,
              device: deviceToConnect(context),
            }),
            // Never treat `connect` resolving as proof the device is back: the transport hands its
            // cached link straight back. The read this goes to is what decides.
            onDone: {
              actions: assign({ connectedDevice: ({ event }) => event.output }),
              target: "#waitForDeviceReady.Reading",
            },
            onError: "AwaitingDiscoveryRetry",
          },
          after: {
            deviceCallTimeout: "AwaitingDiscoveryRetry",
          },
        },
      },
    },
    Reading: {
      invoke: {
        src: "getOsVersion",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
        }),
        onDone: [
          {
            guard: ({ context, event }) =>
              isSuccessCommandResult(event.output) &&
              isTargetReached(event.output.data, context.target),
            actions: assign({
              osVersion: ({ event }) =>
                isSuccessCommandResult(event.output) ? event.output.data : null,
            }),
            target: "Ready",
          },
          {
            guard: ({ event }) =>
              !isSuccessCommandResult(event.output) &&
              isDeviceDisconnectedError(event.output.error),
            target: "Reconnecting",
          },
          {
            target: "Waiting",
          },
        ],
        onError: [
          {
            guard: ({ event }) => isDeviceDisconnectedError(event.error),
            target: "Reconnecting",
          },
          {
            target: "Waiting",
          },
        ],
      },
      // A read that never answers went out over a link that is gone, which only reconnecting fixes.
      // Leaving the state drops the call, so nothing has to bound it from the inside.
      after: {
        deviceCallTimeout: "Reconnecting",
      },
    },
    Waiting: {
      after: {
        poll: "Reading",
      },
    },
    Ready: {
      type: "final",
    },
  },
  output: ({ context }) => ({
    osVersion: context.osVersion!,
    connectedDevice: context.connectedDevice,
  }),
});
