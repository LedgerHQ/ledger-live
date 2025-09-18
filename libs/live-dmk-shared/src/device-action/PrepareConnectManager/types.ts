import type {
  DeviceActionState,
  GoToDashboardDAError,
  GoToDashboardDAInput,
  GoToDashboardDAIntermediateValue,
} from "@ledgerhq/device-management-kit";

export type PrepareConnectManagerDAOutput = void;
export type PrepareConnectManagerDAInput = GoToDashboardDAInput;
export type PrepareConnectManagerDAError = GoToDashboardDAError;
export type PrepareConnectManagerDAIntermediateValue = GoToDashboardDAIntermediateValue;

export type PrepareConnectManagerDAState = DeviceActionState<
  PrepareConnectManagerDAOutput,
  PrepareConnectManagerDAError,
  PrepareConnectManagerDAIntermediateValue
>;
