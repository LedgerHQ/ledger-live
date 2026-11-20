import type { ReceiveVerification } from "@domain/entity-account-receive";

export type DeviceShownVerification = Extract<ReceiveVerification, { type: "address" }>;

/** Whether Verify can be offered: the device shows this address for the user to compare. */
export function canVerifyOnDevice(
  verification: ReceiveVerification | undefined,
): verification is DeviceShownVerification {
  return verification?.type === "address";
}
