import { DeviceModelId } from "@ledgerhq/types-devices";
import { useSelector } from "react-redux";
import { postOnboardingDeviceModelIdSelector } from "../reducer";

/**
 *
 * @returns the DeviceModelId of the device of the post onboarding.
 */
export function usePostOnboardingDeviceModelId(): DeviceModelId | null {
  return useSelector(postOnboardingDeviceModelIdSelector);
}
