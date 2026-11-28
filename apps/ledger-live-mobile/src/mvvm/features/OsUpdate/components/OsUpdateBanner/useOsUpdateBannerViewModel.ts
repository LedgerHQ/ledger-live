import { useCallback, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getDeviceModel } from "@ledgerhq/devices";
import { selectOsUpdates } from "@domain/entity-device-os-update";
import { useSelector } from "~/context/hooks";
import {
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
  lastSeenDeviceSelector,
} from "~/reducers/settings";
import { hasConnectedDeviceSelector } from "~/reducers/appstate";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { getDeviceSymbolByModelId } from "LLM/utils/getDeviceIcon";
import { toDmkDevice } from "../../ports/osUpdateDevice";
import { isOsUpdateTransportSupported } from "../../utils/isOsUpdateTransportSupported";
import { navigateToMyLedger } from "../../utils/myLedgerNavigation";

export function useOsUpdateBannerViewModel() {
  const navigation = useNavigation<BaseNavigation>();
  const isInMyLedgerDeviceScreen = useRoute().name === ScreenName.MyLedgerDevice;
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const latestOsUpdate = useSelector(selectOsUpdates).at(-1);
  const [isUpdateOnDesktopOpen, setIsUpdateOnDesktopOpen] = useState(false);
  const modelId = lastConnectedDevice?.modelId ?? lastSeenDevice?.modelId;

  const osVersion =
    lastSeenDevice?.modelId === lastConnectedDevice?.modelId
      ? lastSeenDevice?.deviceInfo.version
      : undefined;

  const onUpdate = useCallback(() => {
    if (!lastConnectedDevice) return;
    if (!isOsUpdateTransportSupported(lastConnectedDevice, osVersion)) {
      setIsUpdateOnDesktopOpen(true);
      return;
    }
    if (isInMyLedgerDeviceScreen) {
      navigation.navigate(ScreenName.OsUpdate, { device: toDmkDevice(lastConnectedDevice) });
      return;
    }
    navigateToMyLedger(navigation, { device: lastConnectedDevice, firmwareUpdate: true });
  }, [lastConnectedDevice, osVersion, isInMyLedgerDeviceScreen, navigation]);
  const onCloseUpdateOnDesktop = useCallback(() => setIsUpdateOnDesktopOpen(false), []);

  return {
    banner: {
      placement: isInMyLedgerDeviceScreen ? ("myLedger" as const) : ("portfolio" as const),
      hasCompletedOnboarding,
      hasConnectedDevice,
      analyticsModelId: modelId,
      DeviceIcon: getDeviceSymbolByModelId(lastConnectedDevice?.modelId),
      onUpdate,
    },
    updateOnDesktopSheet: lastConnectedDevice
      ? {
          isOpen: isUpdateOnDesktopOpen,
          page: isInMyLedgerDeviceScreen ? "my ledger" : "portfolio",
          productName: getDeviceModel(lastConnectedDevice.modelId).productName,
          analyticsModelId: lastConnectedDevice.modelId,
          wired: lastConnectedDevice.wired,
          osVersionFrom: osVersion,
          osVersionTo: latestOsUpdate?.finalFirmware.version,
          onClose: onCloseUpdateOnDesktop,
        }
      : null,
  };
}
