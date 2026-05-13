import { useCallback, useMemo } from "react";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceModel } from "@ledgerhq/devices";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useTrack } from "~/analytics";
import { ScreenName } from "~/const";
import { seenDevicesSelector } from "~/reducers/settings";

export type UseRequiredFirmwareUpdateViewModelProps = {
  device: Device;
  navigation: NavigationProp<ParamListBase>;
  onClose?: () => void;
};

export type RequiredFirmwareUpdateViewProps = {
  isUsbCapable: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  onPressCta: () => void;
};

/**
 * ViewModel for `RequiredFirmwareUpdate`. Produces the strings + handlers the
 * View renders, with all side effects (Redux, translation, analytics,
 * navigation) confined here.
 *
 * The redirect intentionally forwards only `device` + `deviceInfo` — the
 * destination `FirmwareUpdate` screen owns its own firmware-update-context
 * fetching (and loading state), so this hook never depends on async data
 * being available at click time.
 */
export function useRequiredFirmwareUpdateViewModel({
  device,
  navigation,
  onClose,
}: UseRequiredFirmwareUpdateViewModelProps): RequiredFirmwareUpdateViewProps {
  const { t } = useTranslation();
  const track = useTrack();
  const seenDevices = useSelector(seenDevicesSelector);
  // Pick the most recent seenDevices entry whose modelId matches the device
  // currently in this flow. Falling back to the last entry regardless of model
  // would risk hiding the CTA (when the latest seen device is a different
  // model with no deviceInfo here) or navigating with another device's
  // firmware context.
  const deviceInfo = useMemo(() => {
    for (let i = seenDevices.length - 1; i >= 0; i--) {
      if (seenDevices[i].modelId === device.modelId) {
        return seenDevices[i].deviceInfo ?? null;
      }
    }
    return null;
  }, [seenDevices, device.modelId]);

  const isUsbCapable = !!deviceInfo;
  const deviceName = getDeviceModel(device.modelId).productName;

  const onPressCta = useCallback(() => {
    if (!deviceInfo) return;
    track("button_clicked", {
      button: "GoToOSUpdate",
      page: "Update_OS_To_Continue",
    });
    // Walk up the navigator tree to find the ancestor that registers
    // FirmwareUpdate. Calling `navigate` on a navigator that doesn't register
    // the screen silently fails (root cause of the bug from the swap drawer).
    let walker: NavigationProp<ParamListBase> | undefined = navigation;
    while (walker && !walker.getState()?.routeNames?.includes(ScreenName.FirmwareUpdate)) {
      walker = walker.getParent();
    }
    if (!walker) return;
    walker.navigate(ScreenName.FirmwareUpdate, {
      device,
      deviceInfo,
      onBackFromUpdate: () => walker?.goBack(),
    });
    onClose?.();
  }, [device, deviceInfo, navigation, onClose, track]);

  const titleKey = isUsbCapable
    ? "firmwareUpdateRequired.updateAvailableFromLLM.title"
    : "firmwareUpdateRequired.updateNotAvailableFromLLM.title";
  const descriptionKey = isUsbCapable
    ? "firmwareUpdateRequired.updateAvailableFromLLM.description"
    : "firmwareUpdateRequired.updateNotAvailableFromLLM.description";

  return {
    isUsbCapable,
    title: t(titleKey, { deviceName }),
    description: t(descriptionKey, { deviceName }),
    ctaLabel: t("firmwareUpdateRequired.updateAvailableFromLLM.cta"),
    onPressCta,
  };
}
