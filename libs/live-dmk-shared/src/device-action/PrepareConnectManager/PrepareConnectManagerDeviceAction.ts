import { Right } from "purify-ts";
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

export class PrepareConnectManagerDeviceAction extends XStateDeviceAction<
  PrepareConnectManagerDAOutput,
  PrepareConnectManagerDAInput,
  PrepareConnectManagerDAError,
  PrepareConnectManagerDAIntermediateValue,
  undefined
> {
  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    PrepareConnectManagerDAOutput,
    PrepareConnectManagerDAInput,
    PrepareConnectManagerDAError,
    PrepareConnectManagerDAIntermediateValue,
    undefined
  > {
    type types = StateMachineTypes<
      PrepareConnectManagerDAOutput,
      PrepareConnectManagerDAInput,
      PrepareConnectManagerDAError,
      PrepareConnectManagerDAIntermediateValue,
      undefined
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
          _internalState: undefined,
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
              target: "Success",
              actions: () => {
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
              },
            },
          },
        },
        Success: {
          type: "final",
        },
      },
      output: _ => {
        // Ignore device action errors that can happen if the device is in bootloader mode.
        // The goal here is just to clean DMK session state, but actual connectManager is done in
        // outside of the DMK, and errors will be caught there instead.
        return Right(undefined);
      },
    });
  }
}
