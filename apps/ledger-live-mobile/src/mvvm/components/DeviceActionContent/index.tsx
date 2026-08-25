import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  DeviceActionContent as PlatformDeviceActionContent,
  toDeviceActionModelId,
} from "@features/platform-device-action-content";
import { useTheme as useStyledTheme } from "styled-components/native";
import type {
  DeviceActionAnimationTheme,
  DeviceActionContentProps,
  SupportedDeviceActionModelId,
} from "./types";

/**
 * Mobile adapter for `@features/platform-device-action-content`: resolves the current app
 * theme and converts the legacy `DeviceModelId` enum, so consumers keep passing today's props.
 */
export function DeviceActionContent({ deviceModelId, theme, ...props }: DeviceActionContentProps) {
  const styledTheme = useStyledTheme();
  const resolvedTheme = theme ?? getStyledAnimationTheme(styledTheme);

  return (
    <PlatformDeviceActionContent
      {...props}
      deviceModelId={toDeviceActionModelId(deviceModelId)}
      theme={resolvedTheme}
    />
  );
}

function getStyledAnimationTheme(styledTheme: { theme?: string }): DeviceActionAnimationTheme {
  return styledTheme.theme === "dark" ? "dark" : "light";
}

export const supportedDeviceActionModelIds: SupportedDeviceActionModelId[] = Object.values(
  DeviceModelId,
).filter((modelId): modelId is SupportedDeviceActionModelId => modelId !== DeviceModelId.blue);

export type {
  DeviceActionAnimationSource,
  DeviceActionAnimationTheme,
  DeviceActionContentAction,
  DeviceActionContentBanner,
  DeviceActionContentProps,
  SupportedDeviceActionModelId,
} from "./types";
