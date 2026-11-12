import React, { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { OsUpdateBanner as OsUpdateBannerBlock } from "@features/flow-device-os-update/native";
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
import { navigateToMyLedger } from "../../utils/myLedgerNavigation";

export function OsUpdateBanner() {
  const navigation = useNavigation<BaseNavigation>();
  const isInMyLedgerDeviceScreen = useRoute().name === ScreenName.MyLedgerDevice;
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const modelId = lastConnectedDevice?.modelId ?? lastSeenDevice?.modelId;

  const onUpdate = useCallback(() => {
    if (!lastConnectedDevice) return;
    if (isInMyLedgerDeviceScreen) {
      navigation.navigate(ScreenName.OsUpdate, { device: toDmkDevice(lastConnectedDevice) });
      return;
    }
    navigateToMyLedger(navigation, { device: lastConnectedDevice, firmwareUpdate: true });
  }, [lastConnectedDevice, isInMyLedgerDeviceScreen, navigation]);

  return (
    <OsUpdateBannerBlock
      placement={isInMyLedgerDeviceScreen ? "myLedger" : "portfolio"}
      hasCompletedOnboarding={hasCompletedOnboarding}
      hasConnectedDevice={hasConnectedDevice}
      analyticsModelId={modelId}
      DeviceIcon={getDeviceSymbolByModelId(lastConnectedDevice?.modelId)}
      onUpdate={onUpdate}
    />
  );
}
