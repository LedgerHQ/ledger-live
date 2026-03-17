import type {
  DeviceActionState,
  GoToDashboardDAError,
  GoToDashboardDAInput,
  GoToDashboardDAIntermediateValue,
} from "@ledgerhq/device-management-kit";
import { UserInteractionRequired } from "@ledgerhq/device-management-kit";

export const prepareConnectManagerDAStateStep = Object.freeze({
  DEVICE_READY: "prepareConnectManager.steps.deviceReady",
} as const);

export type PrepareConnectManagerDAOutput = void;
export type PrepareConnectManagerDAInput = GoToDashboardDAInput;
export type PrepareConnectManagerDAError = GoToDashboardDAError;
export type PrepareConnectManagerDAIntermediateValue =
  | GoToDashboardDAIntermediateValue
  | {
      requiredUserInteraction: UserInteractionRequired.None;
      step: typeof prepareConnectManagerDAStateStep.DEVICE_READY;
    };

export type PrepareConnectManagerDAState = DeviceActionState<
  PrepareConnectManagerDAOutput,
  PrepareConnectManagerDAError,
  PrepareConnectManagerDAIntermediateValue
>;
