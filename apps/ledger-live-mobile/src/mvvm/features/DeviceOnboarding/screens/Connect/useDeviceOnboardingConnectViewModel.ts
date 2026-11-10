import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsFocused, useNavigation, type ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { dmkToLedgerDeviceIdMap, type DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import {
  useDeviceOnboardingHost,
  useDeviceOnboardingSession,
} from "../../hooks/DeviceOnboardingProvider";
import { useOfferSync } from "../../hooks/useOfferSync";
import { selectPairedKnownDevices } from "../../utils/pairedDevice";
import { shouldRevealFunnel } from "../../utils/pairingHold";

export type DeviceOnboardingConnectModel = Readonly<{
  closeLabel: string;
  showDeviceList: boolean;
  onConnected: (result: DeviceConnectionResult) => void;
  onClose: () => void;
  onDeviceNotFound: () => void;
}>;

export function useDeviceOnboardingConnectViewModel(): DeviceOnboardingConnectModel {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const dmk = useDeviceManagementKit();
  const offerSync = useOfferSync();
  const knownDevices = useSelector(knownDevicesSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [wasReadOnlyAtEntry] = useState(readOnlyModeEnabled);
  const [pairedDevice, setPairedDevice] = useState<Device>();
  const revealed = useRef(false);

  const pairedKnownDevices = useMemo(
    () => selectPairedKnownDevices(knownDevices, pairedDevice?.deviceId),
    [knownDevices, pairedDevice?.deviceId],
  );
  const host = useMemo(
    () => ({
      navigation,
      dmk,
      knownDevices: pairedKnownDevices,
      offerSync,
      wasReadOnlyAtEntry,
    }),
    [dmk, navigation, offerSync, pairedKnownDevices, wasReadOnlyAtEntry],
  );
  useDeviceOnboardingHost(host);
  const { adopt, discard, state, error } = useDeviceOnboardingSession();

  // Keep the pairing screen until the machine knows which screen comes next.
  useEffect(() => {
    if (!pairedDevice || revealed.current) return;
    if (!shouldRevealFunnel(state, error)) return;
    revealed.current = true;
    navigation.replace(ScreenName.DeviceOnboardingFunnel, {
      pairedDeviceId: pairedDevice.deviceId,
      wasReadOnlyAtEntry,
    });
  }, [error, navigation, pairedDevice, state, wasReadOnlyAtEntry]);

  const onConnected = useCallback(
    (result: DeviceConnectionResult) => {
      setPairedDevice({
        deviceId: result.compatDeviceId,
        deviceName: result.compatDeviceName,
        modelId: dmkToLedgerDeviceIdMap[result.connectedDevice.modelId],
        wired: result.compatDeviceWired,
      });
      adopt(result);
    },
    [adopt],
  );

  const onClose = useCallback(() => {
    if (pairedDevice && !revealed.current) discard();
    navigation.goBack();
  }, [discard, navigation, pairedDevice]);

  const onDeviceNotFound = useCallback(() => {
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: { screen: ScreenName.OnboardingDeviceSelection, params: { missingDevice: true } },
    });
  }, [navigation]);

  return {
    closeLabel: t("common.close"),
    showDeviceList: isFocused || pairedDevice !== undefined,
    onConnected,
    onClose,
    onDeviceNotFound,
  };
}
