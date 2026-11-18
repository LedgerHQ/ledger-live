import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceUnlockSheetProps } from "LLM/features/DeviceOnboarding/types";

export const deviceLockedState = "deviceLocked";

export function toDeviceUnlockSheetProps(
  device: Pick<Device, "modelId" | "deviceName">,
): DeviceUnlockSheetProps {
  return { deviceModelId: device.modelId, deviceName: device.deviceName ?? "" };
}
