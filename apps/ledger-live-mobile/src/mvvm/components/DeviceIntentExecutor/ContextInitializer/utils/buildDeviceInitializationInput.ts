import {
  buildEnsureAppReadyInput,
  type BuildEnsureAppReadyInputParams,
} from "@ledgerhq/live-common/device/use-cases/ensureAppReady/buildEnsureAppReadyInput";
import type { InitializationInput } from "../../types";

export type BuildDeviceInitializationInputParams = BuildEnsureAppReadyInputParams;

/**
 * Build the `deviceInitializationInput` consumed by the LWM
 * `DeviceIntentExecutor` from an `AppRequest`.
 *
 * Canonical translation from the rich `AppRequest` shape (account, currency,
 * dependencies, …) that flows already build for the legacy `connectApp`
 * device-action into the structured input the executor needs to drive
 * Phase 2 (device context initialisation).
 *
 * @see buildEnsureAppReadyInput - underlying implementation.
 */
export function buildDeviceInitializationInput(
  params: BuildDeviceInitializationInputParams,
): Promise<InitializationInput> {
  return buildEnsureAppReadyInput(params);
}
