import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
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
    "compatDeviceId" | "compatDeviceName" | "compatDeviceWired" | "connectedDevice"
  >,
): InitializerDevice {
  const { compatDeviceId, compatDeviceName, compatDeviceWired, connectedDevice } = connectionResult;
  const modelId = dmkToLedgerDeviceIdMap[connectedDevice.modelId];
  const productName = getDeviceModel(modelId).productName;

  return {
    id: compatDeviceId,
    modelId,
    name: compatDeviceName || productName,
    productName,
    wired: compatDeviceWired,
  };
}
