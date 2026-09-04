import { DeviceActionStatus, UnknownDAError } from "@ledgerhq/device-management-kit";
import type {
  DeviceAction,
  DeviceActionIntermediateValue,
  DeviceActionState,
  DeviceManagementKit,
  DeviceSessionId,
  DmkError,
} from "@ledgerhq/device-management-kit";
import { Left, Right, type Either } from "purify-ts";
import { Observable } from "rxjs";
import { assign, fromObservable, setup, StateMachine, StateSchema } from "xstate";
import { DeviceActionStoppedError } from "./DeviceActionStoppedError";

export type ExecuteDeviceActionStateMachineInput<DAInput> = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  daInput: DAInput;
};

export type ExecuteDeviceActionStateMachineContext<
  DAOutput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
  DAInput,
> = {
  input: ExecuteDeviceActionStateMachineInput<DAInput>;
  lastState: DeviceActionState<DAOutput, DAError, DAIntermediateValue> | null;
  intermediateValue: DAIntermediateValue | null;
  unexpectedError: { cause: unknown } | null;
};

export type ExecuteDeviceActionStateMachineOutput<
  DAOutput,
  DAError extends DmkError = DmkError,
> = Either<DAError | DmkError, DAOutput>;

export type ExecuteDeviceActionStateMachine<
  DAOutput,
  DAInput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
> = StateMachine<
  ExecuteDeviceActionStateMachineContext<DAOutput, DAError, DAIntermediateValue, DAInput>,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // event
  any, // children
  any, // actor
  any, // action
  any, // guard
  any, // delay
  any, // state value
  any, // tag
  /* eslint-enable @typescript-eslint/no-explicit-any */
  ExecuteDeviceActionStateMachineInput<DAInput>,
  ExecuteDeviceActionStateMachineOutput<DAOutput, DAError | DmkError>,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // emitted
  any, // meta
  /* eslint-enable @typescript-eslint/no-explicit-any */
  StateSchema
>;

export type CreateDeviceActionStateMachineArgs<
  DAOutput,
  DAInput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
> = {
  createDeviceAction: (
    input: DAInput,
  ) => DeviceAction<DAOutput, DAInput, DAError, DAIntermediateValue>;
};

export const createDeviceActionStateMachine = <
  DAOutput,
  DAInput,
  DAError extends DmkError,
  DAIntermediateValue extends DeviceActionIntermediateValue,
>({
  createDeviceAction,
}: CreateDeviceActionStateMachineArgs<
  DAOutput,
  DAInput,
  DAError,
  DAIntermediateValue
>): ExecuteDeviceActionStateMachine<DAOutput, DAInput, DAError, DAIntermediateValue> => {
  return setup({
    types: {
      input: {} as ExecuteDeviceActionStateMachineInput<DAInput>,
      context: {} as ExecuteDeviceActionStateMachineContext<
        DAOutput,
        DAError,
        DAIntermediateValue,
        DAInput
      >,
      output: {} as ExecuteDeviceActionStateMachineOutput<DAOutput, DAError | DmkError>,
    },
    actors: {
      runDeviceAction: fromObservable<
        DeviceActionState<DAOutput, DAError, DAIntermediateValue>,
        ExecuteDeviceActionStateMachineInput<DAInput>
      >(({ input }) => {
        const { observable, cancel } = input.dmk.executeDeviceAction({
          sessionId: input.sessionId,
          deviceAction: createDeviceAction(input.daInput),
        });
        return new Observable(subscriber => {
          const subscription = observable.subscribe(subscriber);
          return () => {
            cancel();
            subscription.unsubscribe();
          };
        });
      }),
    },
    actions: {
      assignLastState: assign({
        lastState: ({ event }) => {
          return event.snapshot.context as DeviceActionState<
            DAOutput,
            DAError,
            DAIntermediateValue
          >;
        },
      }),
      assignIntermediateValue: assign({
        intermediateValue: ({ event, context }) => {
          const state = event.snapshot.context as DeviceActionState<
            DAOutput,
            DAError,
            DAIntermediateValue
          >;
          if (state?.status !== DeviceActionStatus.Pending) {
            return context.intermediateValue;
          }
          return state.intermediateValue;
        },
      }),
      assignUnexpectedError: assign({
        unexpectedError: ({ event }) => ({ cause: event.error }),
      }),
    },
  }).createMachine({
    id: "ExecuteDeviceAction",
    initial: "Running",
    context: ({ input }) => ({
      input,
      lastState: null,
      intermediateValue: null,
      unexpectedError: null,
    }),
    states: {
      Running: {
        invoke: {
          src: "runDeviceAction",
          input: ({ context }) => context.input,
          onSnapshot: {
            actions: ["assignIntermediateValue", "assignLastState"],
          },
          onDone: {
            target: "Done",
          },
          onError: {
            target: "Failed",
            actions: "assignUnexpectedError",
          },
        },
      },
      Done: { type: "final" },
      Failed: { type: "final" },
    },
    output: ({ context }) => {
      if (context.unexpectedError !== null) {
        return Left(
          new UnknownDAError(
            context.unexpectedError.cause instanceof Error
              ? context.unexpectedError.cause.message
              : "Device action actor failed",
          ),
        );
      }
      const state = context.lastState;
      if (state?.status === DeviceActionStatus.Completed) {
        return Right(state.output);
      }
      if (state?.status === DeviceActionStatus.Error) {
        return Left(state.error);
      }
      if (state?.status === DeviceActionStatus.Stopped) {
        return Left(new DeviceActionStoppedError());
      }
      return Left(new UnknownDAError("Device action completed without a terminal snapshot"));
    },
  });
};
