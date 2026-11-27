import type { StakePositionExitAction } from "@features/flow-stake-position";

export type StakePositionSignatureExtraProps = Readonly<{
  /** The name of the connected device, empty until it is known. */
  deviceName: string;
  /** The exit being signed, which the processing heading names. */
  action: StakePositionExitAction;
}>;
