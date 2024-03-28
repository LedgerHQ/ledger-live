import { DeviceModelId } from "@ledgerhq/devices";
import {
  CLSSupportedDeviceModelId,
  supportedDeviceModelIds,
} from "../capabilities/isCustomLockScreenSupported";

type ScreenSpecs = {
  /** width of the screen in pixels */
  width: number;
  /** height of the screen in pixels */
  height: number;
  /** number of pixels at the top of the screen which are not visible */
  paddingTop: number;
  /** number of pixels at the bottom of the screen which are not visible */
  paddingBottom: number;
  /** number of pixels at the left of the screen which are not visible */
  paddingLeft: number;
  /** number of pixels at the right of the screen which are not visible */
  paddingRight: number;
};

const NO_PADDING = {
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
} as const;

export const SCREEN_SPECS: Record<CLSSupportedDeviceModelId, ScreenSpecs> = {
  [DeviceModelId.stax]: {
    width: 400,
    height: 672,
    ...NO_PADDING,
    paddingBottom: 2,
  },
  [DeviceModelId.europa]: {
    width: 480,
    height: 600,
    ...NO_PADDING,
  },
};

type Dimensions = {
  width: number;
  height: number;
};

export function getScreenSpecs(deviceModelId: CLSSupportedDeviceModelId) {
  return SCREEN_SPECS[deviceModelId];
}

const screenDataDimensions: Record<CLSSupportedDeviceModelId, Dimensions> =
  supportedDeviceModelIds.reduce(
    (acc, deviceModelId) => {
      const { width, height } = SCREEN_SPECS[deviceModelId];
      acc[deviceModelId] = { width, height };
      return acc;
    },
    {} as Record<CLSSupportedDeviceModelId, Dimensions>,
  );

export function getScreenDataDimensions(deviceModelId: CLSSupportedDeviceModelId) {
  return screenDataDimensions[deviceModelId];
}

const screenVisibleAreaDimensions: Record<CLSSupportedDeviceModelId, Dimensions> =
  supportedDeviceModelIds.reduce(
    (acc, deviceModelId) => {
      const { width, height, paddingTop, paddingBottom, paddingLeft, paddingRight } =
        SCREEN_SPECS[deviceModelId];
      acc[deviceModelId] = {
        width: width - paddingLeft - paddingRight,
        height: height - paddingTop - paddingBottom,
      };
      return acc;
    },
    {} as Record<CLSSupportedDeviceModelId, Dimensions>,
  );

/**
 *
 * @param deviceModelId
 * @returns the dimensions of the visible area of the screen (without padding)
 */
export function getScreenVisibleAreaDimensions(deviceModelId: CLSSupportedDeviceModelId) {
  return screenVisibleAreaDimensions[deviceModelId];
}
