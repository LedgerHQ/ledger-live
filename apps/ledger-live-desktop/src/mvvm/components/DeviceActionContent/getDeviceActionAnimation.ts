import { DeviceModelId } from "@ledgerhq/types-devices";
import type { CSSProperties } from "react";
import type { AnimationKey } from "~/renderer/components/DeviceAction/animations";
import { getDeviceAnimation as getDesktopDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import type {
  DeviceActionAnimationSource,
  DeviceActionAnimationTheme,
  DeviceActionContentAction,
  SupportedDeviceActionModelId,
} from "./types";

const actionAnimationKeys: Record<DeviceActionContentAction, AnimationKey> = {
  continue: "openApp",
  "power-and-unlock": "enterPinCode",
};

export const supportedDeviceActionModelIds = Object.values(DeviceModelId).filter(
  (modelId): modelId is SupportedDeviceActionModelId => modelId !== DeviceModelId.blue,
);

export function isSupportedDeviceActionModelId(
  modelId: DeviceModelId,
): modelId is SupportedDeviceActionModelId {
  return modelId !== DeviceModelId.blue;
}

export function getDeviceActionAnimation({
  action,
  modelId,
  theme = "light",
}: {
  action: DeviceActionContentAction;
  modelId: DeviceModelId;
  theme?: DeviceActionAnimationTheme;
}): DeviceActionAnimationSource {
  if (!isSupportedDeviceActionModelId(modelId)) return undefined;

  return (
    getDesktopDeviceAnimation(
      getDeviceActionAnimationModelId(modelId),
      theme,
      actionAnimationKeys[action],
    ) ?? undefined
  );
}

export function getDeviceActionAnimationStyle(modelId: DeviceModelId): CSSProperties {
  if (!isSupportedDeviceActionModelId(modelId)) return {};

  return {
    height: 200,
    width: 200,
  };
}

function getDeviceActionAnimationModelId(modelId: SupportedDeviceActionModelId) {
  return modelId === DeviceModelId.nanoS ? DeviceModelId.nanoSP : modelId;
}
