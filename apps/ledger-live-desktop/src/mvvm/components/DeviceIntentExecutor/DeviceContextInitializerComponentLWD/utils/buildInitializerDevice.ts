import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import type { InitializerDevice } from "../types";

/**
 * Maps the raw device connection result to the minimal, display-only
 * {@link InitializerDevice} consumed by the presentational initializer states
 * (titles, product name, wired badge, etc.).
 *
 * It carries no behavior and is not used for device communication: it only
 * normalizes the `compat*` fields and derives the product name so the views
 * have stable, ready-to-render data.
 */
export function buildInitializerDevice(
  connectionResult: Pick<
    DeviceConnectionResult,
    "compatDeviceId" | "compatDeviceModelId" | "compatDeviceName" | "compatDeviceWired"
  >,
): InitializerDevice {
  const { compatDeviceId, compatDeviceModelId, compatDeviceName, compatDeviceWired } =
    connectionResult;
  const productName = getDeviceModel(compatDeviceModelId).productName;

  return {
    id: compatDeviceId,
    modelId: compatDeviceModelId,
    name: compatDeviceName || productName,
    productName,
    wired: compatDeviceWired,
  };
}
