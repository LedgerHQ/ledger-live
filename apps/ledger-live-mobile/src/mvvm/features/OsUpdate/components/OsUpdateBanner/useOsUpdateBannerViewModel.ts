import { useCallback, useMemo, useRef } from "react";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import { track } from "@shared/analytics";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import {
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
  lastSeenDeviceSelector,
} from "~/reducers/settings";
import { hasConnectedDeviceSelector } from "~/reducers/appstate";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { osUpdatesSelector } from "../../state/osUpdateSlice";
import { navigateToMyLedger } from "../../utils/myLedgerNavigation";

export type OsUpdateBannerVariant = "hidden" | "portfolio" | "myLedger";

export function useOsUpdateBannerViewModel() {
  const navigation = useNavigation<BaseNavigation>();
  const route = useRoute();
  const isInMyLedgerDeviceScreen = route.name === ScreenName.MyLedgerDevice;
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const latestOsUpdate = useSelector(osUpdatesSelector).at(-1);

  const device = useMemo(
    () =>
      lastConnectedDevice
        ? {
            id: lastConnectedDevice.deviceId,
            name: lastConnectedDevice.deviceName ?? null,
            deviceModelId: lastConnectedDevice.modelId,
            transport: lastConnectedDevice.wired
              ? rnHidTransportIdentifier
              : rnBleTransportIdentifier,
          }
        : undefined,
    [lastConnectedDevice],
  );
  const bannerVisible = Boolean(latestOsUpdate) && hasCompletedOnboarding && hasConnectedDevice;
  const version = latestOsUpdate?.finalFirmware.version ?? "";
  const modelId = device?.deviceModelId ?? lastSeenDevice?.modelId;

  const visibleVariant = isInMyLedgerDeviceScreen ? "myLedger" : "portfolio";
  const variant: OsUpdateBannerVariant = bannerVisible ? visibleVariant : "hidden";

  const page = isInMyLedgerDeviceScreen ? "my ledger" : "portfolio";
  const impressionTracked = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (impressionTracked.current) return;
      impressionTracked.current = true;
      track("banner_impression", { banner: "OS update", page, modelId });
    }, [page, modelId]),
  );

  const onClickUpdate = useCallback(() => {
    track("button_clicked", {
      page,
      banner: "OS update",
      button: "click(update)",
      modelId,
    });
    if (!lastConnectedDevice || !device) return;

    if (isInMyLedgerDeviceScreen) {
      navigation.navigate(ScreenName.OsUpdate, { device });
      return;
    }

    navigateToMyLedger(navigation, {
      device: lastConnectedDevice,
      shouldDisplayMyWallet,
      firmwareUpdate: true,
    });
  }, [
    page,
    modelId,
    lastConnectedDevice,
    device,
    isInMyLedgerDeviceScreen,
    navigation,
    shouldDisplayMyWallet,
  ]);

  return {
    variant,
    version,
    deviceModelId: device?.deviceModelId,
    onClickUpdate,
  };
}
