import { createContext } from "react";
import { DeviceModelId } from "@ledgerhq/devices";

export type NullableDeviceModelId = DeviceModelId | null;

type OnboardingContextValue = {
  deviceModelId: NullableDeviceModelId;
  setDeviceModelId: (deviceModelId: NullableDeviceModelId) => void;
};

export const OnboardingContext = createContext<OnboardingContextValue>({
  deviceModelId: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDeviceModelId: () => {},
});
