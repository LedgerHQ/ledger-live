import {
  DeviceStatus,
  GetAppAndVersionCommand,
  isSuccessCommandResult,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import { assign, enqueueActions, fromCallback, fromPromise, setup } from "xstate";
import {
  DEVICE_CALL_TIMEOUT_MS,
  POLL_INTERVAL_MS,
  SESSION_SETTLE_TIMEOUT_MS,
  SESSION_TEARDOWN_TIMEOUT_MS,
} from "./constants";
import {
  CheckErrorCauseResult,
  CheckErrorCauseStateMachineEventType,
  DeviceSituation,
  DeviceSituationEventType,
  type CheckErrorCauseStateMachine,
  type CheckErrorCauseStateMachineContext,
  type CheckErrorCauseStateMachineEvent,
  type CheckErrorCauseStateMachineInput,
  type CheckErrorCauseStateMachineOutput,
} from "./types";
import { isDeviceDisconnectedError } from "./utils/isDeviceDisconnectedError";
import { isDeviceLockedError } from "./utils/isDeviceLockedError";

/**
 * Decides whether a device action that just failed can be resumed.
 *
 * The rejection itself says very little. A locked device and a lost connection both reach us either
 * as a tagged DMK error, or buried inside a generic `UnknownDAError`: the device action keeps the
 * message but drops the `_tag` on its way out. So a generic error has to be probed and NEVER trusted.
 *
 * Timing makes it harder. The transport keeps a `DeviceConnectionStateMachine` per device; when the
 * link drops it moves to `WaitingForReconnection` and retries on its own for a fixed window (15s on
 * Android BLE, 10s on iOS BLE). A device action fails on the first broken exchange, so we almost
 * always run while that window is still open, and for as long as it is:
 *   - the session still reports CONNECTED, so its status cannot classify the error right away;
 *   - the transport keeps its link cached, and `connect` hands it straight back without any BLE work;
 *   - the device counts as connected for the OS, so it stops advertising and discovery stays blind.
 *
 * Hence the shape below: classify the error, close that window rather than race it, and only report
 * recovery once the device has answered an APDU.
 */
export const checkErrorCauseStateMachine: CheckErrorCauseStateMachine = setup({
  types: {
    input: {} as CheckErrorCauseStateMachineInput,
    context: {} as CheckErrorCauseStateMachineContext,
    events: {} as CheckErrorCauseStateMachineEvent,
    output: {} as CheckErrorCauseStateMachineOutput,
  },
  actors: {
    getAppAndVersion: fromPromise(
      async ({
        input,
      }: {
        input: { dmk: DeviceManagementKit; sessionId: DeviceSessionId };
      }): Promise<void> => {
        const result = await input.dmk.sendCommand({
          sessionId: input.sessionId,
          command: new GetAppAndVersionCommand(),
        });
        if (!isSuccessCommandResult(result)) {
          throw result.error;
        }
      },
    ),
    listenUntilDisconnected: fromCallback<
      CheckErrorCauseStateMachineEvent,
      { dmk: DeviceManagementKit; sessionId: DeviceSessionId }
    >(({ input, sendBack }) => {
      let subscription: { unsubscribe: () => void } | undefined;
      const notifyDisconnected = () => {
        sendBack({ type: CheckErrorCauseStateMachineEventType.DEVICE_DISCONNECTED });
        subscription?.unsubscribe();
      };
      try {
        subscription = input.dmk.getDeviceSessionState({ sessionId: input.sessionId }).subscribe({
          next: state => {
            if (state.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
              return;
            }
            notifyDisconnected();
          },
          error: notifyDisconnected,
          // DMK completes the state observable when it closes the session.
          complete: notifyDisconnected,
        });
      } catch {
        // `getDeviceSessionState` throws once DMK has dropped the session.
        notifyDisconnected();
      }
      return () => {
        subscription?.unsubscribe();
      };
    }),
    // Closing the session is what makes reconnecting possible at all:
    //   - the DMK refuses to register a session under an id it already knows, and we reconnect with
    //     the captured id, so a leftover session would keep receiving every command we send;
    //   - it terminates the transport's reconnection window instead of leaving us to connect over
    //     the link the transport still hopes to revive.
    // Disconnecting a session the DMK has already dropped throws, which means the job is done.
    tearDownSession: fromPromise(
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
    // Polling `connect` rather than waiting for the device to show up in discovery. Discovery would
    // only tell us the device is visible, whereas `connect` is both the test and what we need next,
    // and it still works during the gap where the transport has not released its link yet, since a
    // device it holds does not advertise. Passing the device we captured makes the DMK reopen the
    // session under the same id, which is what lets the caller resume its device action.
    // `connect` itself can hang, as it waits for a session ping the dead link never answers, so
    // bound every attempt: without that, one hanging call would end the polling for good.
    reconnectToSameDevice: fromCallback<
      CheckErrorCauseStateMachineEvent,
      { dmk: DeviceManagementKit; connectedDevice: ConnectedDevice }
    >(({ input, sendBack }) => {
      let isStopped = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      let retryTimeout: ReturnType<typeof setTimeout> | undefined;
      const connect = () =>
        new Promise<void>((resolve, reject) => {
          const attemptTimeout = setTimeout(
            () => reject(new Error("connect timed out")),
            DEVICE_CALL_TIMEOUT_MS,
          );
          timeout = attemptTimeout;
          input.dmk
            .connect({
              device: input.connectedDevice,
              sessionRefresherOptions: { isRefresherDisabled: true },
            })
            .then(() => resolve(), reject)
            .finally(() => clearTimeout(attemptTimeout));
        });
      const attemptConnection = async () => {
        try {
          await connect();
          if (!isStopped) {
            sendBack({ type: CheckErrorCauseStateMachineEventType.DEVICE_RECONNECTED });
          }
        } catch {
          if (!isStopped) {
            retryTimeout = setTimeout(attemptConnection, POLL_INTERVAL_MS);
          }
        }
      };
      attemptConnection();
      return () => {
        isStopped = true;
        clearTimeout(timeout);
        clearTimeout(retryTimeout);
      };
    }),
  },
  actions: {
    sendDeviceSituation: enqueueActions(({ context, enqueue }, params: DeviceSituation) => {
      enqueue.sendTo(context.hostRef, {
        type: DeviceSituationEventType.DEVICE_SITUATION_UPDATE,
        situation: params,
      });
    }),
  },
  guards: {
    isDeviceLocked: ({ context }) => isDeviceLockedError(context.error),
    isDeviceDisconnected: ({ context }) => isDeviceDisconnectedError(context.error),
  },
  delays: {
    deviceCallTimeout: DEVICE_CALL_TIMEOUT_MS,
    poll: POLL_INTERVAL_MS,
    sessionSettleTimeout: SESSION_SETTLE_TIMEOUT_MS,
    sessionTeardownTimeout: SESSION_TEARDOWN_TIMEOUT_MS,
  },
}).createMachine({
  id: "checkErrorCause",
  context: ({ input }) => ({
    ...input,
    result: null,
  }),
  initial: "CheckErrorCause",
  states: {
    // Only a tagged error can be routed straight away. Everything else is treated as unclassified,
    // whatever its message says.
    CheckErrorCause: {
      always: [
        {
          guard: "isDeviceLocked",
          target: "AwaitingDeviceUnlock",
        },
        {
          guard: "isDeviceDisconnected",
          target: "AwaitingDeviceReconnection",
        },
        {
          target: "IdentifyConnectionLoss",
        },
      ],
    },
    // At this stage, the error is unclassified, so it may well be a drop whose tag the device action swallowed.
    // The session cannot tell us yet: while DeviceConnectionStateMachine is still trying to
    // reconnect, it keeps reporting CONNECTED. Only if that window expires without a link does it
    // flip to NOT_CONNECTED. Wait the window out instead of guessing, and leave the host on the
    // state it was showing.
    IdentifyConnectionLoss: {
      invoke: {
        src: "listenUntilDisconnected",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
        }),
      },
      on: {
        [CheckErrorCauseStateMachineEventType.DEVICE_DISCONNECTED]: "AwaitingDeviceReconnection",
      },
      after: {
        sessionSettleTimeout: "ProbeUnknownError",
      },
    },
    // The window closed without a NOT_CONNECTED, so one of two things happened: the original
    // failure was never a drop, or DeviceConnectionStateMachine already restored the link
    // (eg: the user plugged the device back in) and we never observed the loss. This single
    // GetAppAndVersion tells them apart. A success means the device answers again, so resume the
    // device action. An error is reclassified from the tags this command still carries, which the
    // device action had dropped: a PIN lock, a drop that only surfaced now, or any other unexpected
    // error, which is unrecoverable. It never loops back to IdentifyConnectionLoss: the host stays
    // on its last state until this probe reaches a verdict.
    ProbeUnknownError: {
      invoke: {
        src: "getAppAndVersion",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
        }),
        onDone: {
          target: "Recovered",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "CheckProbedErrorCause",
        },
      },
    },
    CheckProbedErrorCause: {
      always: [
        {
          guard: "isDeviceLocked",
          target: "AwaitingDeviceUnlock",
        },
        {
          guard: "isDeviceDisconnected",
          target: "AwaitingDeviceReconnection",
        },
        {
          target: "Unrecoverable",
        },
      ],
    },
    // Nothing to do but probe until the user enters the PIN. A probe that fails on something else
    // goes back through classification, since the device may have dropped in the meantime.
    AwaitingDeviceUnlock: {
      entry: {
        type: "sendDeviceSituation",
        params: DeviceSituation.LOCKED,
      },
      initial: "Waiting",
      states: {
        Waiting: {
          after: {
            poll: "Probing",
          },
        },
        Probing: {
          invoke: {
            src: "getAppAndVersion",
            input: ({ context }) => ({
              dmk: context.dmk,
              sessionId: context.connectedDevice.sessionId,
            }),
            onDone: {
              target: "#checkErrorCause.Recovered",
            },
            onError: {
              actions: assign({ error: ({ event }) => event.error }),
              target: "#checkErrorCause.CheckErrorCause",
            },
          },
        },
      },
    },
    // One cycle: drop the session, connect again, prove the device answers. As long as it does not,
    // start the cycle over, since the transport may have handed back a link that is already dead.
    AwaitingDeviceReconnection: {
      entry: {
        type: "sendDeviceSituation",
        params: DeviceSituation.DISCONNECTED,
      },
      initial: "TearDownSession",
      states: {
        // Bounded by a timeout because the React Native HID transport hops the native bridge and
        // can leave the disconnection unconfirmed. Connecting again beats waiting forever.
        TearDownSession: {
          invoke: {
            src: "tearDownSession",
            input: ({ context }) => ({
              dmk: context.dmk,
              sessionId: context.connectedDevice.sessionId,
            }),
            onDone: "Reconnecting",
          },
          after: {
            sessionTeardownTimeout: "Reconnecting",
          },
        },
        Reconnecting: {
          invoke: {
            src: "reconnectToSameDevice",
            input: ({ context }) => ({
              dmk: context.dmk,
              connectedDevice: context.connectedDevice,
            }),
          },
          on: {
            [CheckErrorCauseStateMachineEventType.DEVICE_RECONNECTED]: "VerifyingConnection",
          },
        },
        // `connect` resolving proves nothing on its own: the transport returns its cached link when
        // it still has one, and the session opened over it swallows the failure of its own ping. So
        // only an APDU we send ourselves tells us the device is really there. Reporting recovery on
        // `connect` alone resumes the device action over a dead link, which fails at once.
        VerifyingConnection: {
          invoke: {
            src: "getAppAndVersion",
            input: ({ context }) => ({
              dmk: context.dmk,
              sessionId: context.connectedDevice.sessionId,
            }),
            onDone: {
              target: "#checkErrorCause.Recovered",
            },
            onError: {
              target: "Retrying",
            },
          },
          // The command can stay pending on a link that is gone, which would leave the loop here
          // for good.
          after: {
            deviceCallTimeout: "Retrying",
          },
        },
        // Back through the teardown, so the session we could not use is dropped before we open the
        // next one.
        Retrying: {
          after: {
            poll: "TearDownSession",
          },
        },
      },
    },
    Recovered: {
      type: "final",
      entry: assign({ result: CheckErrorCauseResult.Recovered }),
    },
    Unrecoverable: {
      type: "final",
      entry: assign({ result: CheckErrorCauseResult.Unrecoverable }),
    },
  },
  output: ({ context }) => context.result!,
});
