import { DeviceSocketFail } from "@ledgerhq/errors";

/**
 * Detects whether an error from the HSM socket indicates a counterfeit device.
 * When the HSM genuine check identifies a counterfeit device, it sends an error
 * frame with "Counterfeit device detected" in the payload, which surfaces as a
 * DeviceSocketFail. This helper allows callers to route that specific failure to
 * the explicit "not genuine" warning UI instead of the generic error screen.
 */
export const isCounterfeitError = (error: unknown): boolean =>
  error instanceof DeviceSocketFail &&
  typeof (error as Error).message === "string" &&
  /counterfeit/i.test((error as Error).message);
