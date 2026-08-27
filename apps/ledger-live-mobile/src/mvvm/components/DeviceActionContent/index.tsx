import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  DeviceActionContent as PlatformDeviceActionContent,
  toDeviceActionModelId,
} from "@features/platform-device-action-content";
import type { DeviceActionContentProps, SupportedDeviceActionModelId } from "./types";

/**
 * Mobile adapter for `@features/platform-device-action-content`: converts the legacy
 * `DeviceModelId` enum so consumers keep passing today's props. The platform package resolves the
 * light/dark variant itself from the mounted style provider.
 */
export function DeviceActionContent({ deviceModelId, ...props }: DeviceActionContentProps) {
  return (
    <PlatformDeviceActionContent {...props} deviceModelId={toDeviceActionModelId(deviceModelId)} />
  );
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
