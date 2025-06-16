import { Left, Right } from "purify-ts";
import { assign, setup } from "xstate";

import type {
  InternalApi,
  StateMachineTypes,
  DeviceActionStateMachine,
} from "@ledgerhq/device-management-kit";
import {
  DeviceSessionStateType,
  UserInteractionRequired,
  GoToDashboardDeviceAction,
  XStateDeviceAction,
} from "@ledgerhq/device-management-kit";

import type {
  PrepareConnectManagerDAOutput,
  PrepareConnectManagerDAInput,
  PrepareConnectManagerDAError,
  PrepareConnectManagerDAIntermediateValue,
} from "./types";

type PrepareConnectManagerMachineInternalState = {
  readonly error: PrepareConnectManagerDAError | null;
};

export class PrepareConnectManagerDeviceAction extends XStateDeviceAction<
  PrepareConnectManagerDAOutput,
  PrepareConnectManagerDAInput,
  PrepareConnectManagerDAError,
  PrepareConnectManagerDAIntermediateValue,
  PrepareConnectManagerMachineInternalState
> {
  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    PrepareConnectManagerDAOutput,
    PrepareConnectManagerDAInput,
    PrepareConnectManagerDAError,
    PrepareConnectManagerDAIntermediateValue,
    PrepareConnectManagerMachineInternalState
  > {
    type types = StateMachineTypes<
      PrepareConnectManagerDAOutput,
      PrepareConnectManagerDAInput,
      PrepareConnectManagerDAError,
      PrepareConnectManagerDAIntermediateValue,
      PrepareConnectManagerMachineInternalState
    >;

    const unlockTimeout = this.input.unlockTimeout ?? 0;

    const goToDashboardMachine = new GoToDashboardDeviceAction({
      input: {
        unlockTimeout,
      },
    }).makeStateMachine(internalApi);

    return setup({
      types: {
        input: {
          unlockTimeout,
        } as types["input"],
        context: {} as types["context"],
        output: {} as types["output"],
      },
      actors: {
        goToDashboard: goToDashboardMachine,
      },
      guards: {
        hasError: ({ context }) => context._internalState.error !== null,
      },
      actions: {
        assignErrorFromEvent: assign({
          _internalState: _ => ({
            ..._.context._internalState,
            error: _.event["error"], // NOTE: it should never happen, the error is not typed anymore here
          }),
        }),
      },
    }).createMachine({
      id: "PrepareConnectManagerDeviceAction",
      initial: "DeviceReady",
      context: _ => {
        return {
          input: {
            unlockTimeout: _.input.unlockTimeout,
          },
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.None,
          },
          _internalState: {
            error: null,
          },
        };
      },
      states: {
        DeviceReady: {
          always: [
            {
              target: "GoToDashboard",
            },
          ],
        },
        GoToDashboard: {
          exit: assign({
            intermediateValue: _ => ({
              ..._.context.intermediateValue,
              requiredUserInteraction: UserInteractionRequired.None,
            }),
          }),
          invoke: {
            id: "goToDashboard",
            src: "goToDashboard",
            input: _ => ({
              unlockTimeout: _.context.input.unlockTimeout,
            }),
            onSnapshot: {
              actions: assign({
                intermediateValue: _ => _.event.snapshot.context.intermediateValue,
              }),
            },
            onDone: {
              target: "GoToDashboardCheck",
              actions: assign({
                _internalState: _ => {
                  // Invalidate device session state fields that can be modified by the manager
                  const state = internalApi.getDeviceSessionState();
                  if (state.sessionStateType !== DeviceSessionStateType.Connected) {
                    internalApi.setDeviceSessionState({
                      ...state,
                      firmwareUpdateContext: undefined,
                      installedApps: [],
                      appsUpdates: undefined,
                    });
                  }
                  return _.event.output.caseOf<PrepareConnectManagerMachineInternalState>({
                    Right: _data => _.context._internalState,
                    Left: error => ({
                      ..._.context._internalState,
                      error,
                    }),
                  });
                },
              }),
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
        },
        GoToDashboardCheck: {
          always: [
            {
              target: "Error",
              guard: "hasError",
            },
            {
              target: "Success",
            },
          ],
        },
        Success: {
          type: "final",
        },
        Error: {
          type: "final",
        },
      },
      output: args => {
        const { context } = args;
        const { error } = context._internalState;
        if (error) {
          return Left(error);
        }
        return Right(undefined);
      },
    });
  }
}
