import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import type { ActorRef, Snapshot, StateMachine, StateSchema } from "xstate";

export enum DeviceSituation {
  LOCKED = "LOCKED",
  DISCONNECTED = "DISCONNECTED",
}

export enum DeviceSituationEventType {
  DEVICE_SITUATION_UPDATE = "DEVICE_SITUATION_UPDATE",
}

export type DeviceSituationEvent = {
  type: DeviceSituationEventType.DEVICE_SITUATION_UPDATE;
  situation: DeviceSituation;
};

export type DeviceSituationActorRef = ActorRef<Snapshot<unknown>, DeviceSituationEvent>;

export type CheckErrorCauseStateMachineInput = {
  dmk: DeviceManagementKit;
  connectedDevice: ConnectedDevice;
  error: unknown;
  hostRef: DeviceSituationActorRef;
};

export type CheckErrorCauseStateMachineContext = CheckErrorCauseStateMachineInput & {
  result: CheckErrorCauseResult | null;
  rediscoveredDevice: DiscoveredDevice | null;
};

export enum CheckErrorCauseStateMachineEventType {
  DEVICE_DISCONNECTED = "DEVICE_DISCONNECTED",
  DEVICE_FOUND = "DEVICE_FOUND",
}

export type CheckErrorCauseStateMachineEvent =
  | {
      type: CheckErrorCauseStateMachineEventType.DEVICE_DISCONNECTED;
    }
  | {
      type: CheckErrorCauseStateMachineEventType.DEVICE_FOUND;
      device: DiscoveredDevice;
    };

export enum CheckErrorCauseResult {
  Recovered = "recovered",
  Unrecoverable = "unrecoverable",
}

export type CheckErrorCauseStateMachineOutput =
  | {
      result: CheckErrorCauseResult.Recovered;
      connectedDevice: ConnectedDevice;
    }
  | {
      result: CheckErrorCauseResult.Unrecoverable;
    };

export const isRecovered = (
  output: CheckErrorCauseStateMachineOutput,
): output is Extract<
  CheckErrorCauseStateMachineOutput,
  { result: CheckErrorCauseResult.Recovered }
> => output.result === CheckErrorCauseResult.Recovered;

export type CheckErrorCauseStateMachine = StateMachine<
  CheckErrorCauseStateMachineContext,
  CheckErrorCauseStateMachineEvent,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // children
  any, // actor
  any, // action
  any, // guard
  any, // delay
  any, // state value
  any, // tag
  /* eslint-enable @typescript-eslint/no-explicit-any */
  CheckErrorCauseStateMachineInput,
  CheckErrorCauseStateMachineOutput,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // emitted
  any, // meta
  /* eslint-enable @typescript-eslint/no-explicit-any */
  StateSchema
>;
