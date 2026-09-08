import React from "react";
import { DeviceScreenImageView } from "./DeviceScreenImageView";
import {
  useDeviceScreenImageViewModel,
  type DeviceScreenTouch,
} from "./useDeviceScreenImageViewModel";

export interface DeviceScreenImageProps {
  readonly src: string;
  /** Omitted on button-driven devices, which are not tappable. */
  readonly onTouch?: DeviceScreenTouch;
}

export function DeviceScreenImage({ src, onTouch }: DeviceScreenImageProps) {
  return <DeviceScreenImageView src={src} {...useDeviceScreenImageViewModel(src, onTouch)} />;
}
