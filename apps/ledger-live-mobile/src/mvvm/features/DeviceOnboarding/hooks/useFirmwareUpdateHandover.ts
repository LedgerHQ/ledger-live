import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HostOnboardingEvent } from "@features/platform-device-onboarding";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { findMatchingNewDevice } from "@ledgerhq/live-dmk-mobile";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";

const delegatedState = "checks.firmwareUpdateDelegated";

// The OS update reboot changes the BLE address, the advertised name and the USB id.
export function isRebootedDevice(before: Device, after: Device): boolean {
  if (before.modelId !== after.modelId) return false;
  if (before.wired && after.wired) return true;
  return findMatchingNewDevice(before, [after]) !== null;
}

type UseFirmwareUpdateHandoverInput = {
  device: Device | null;
  isDeviceOnboarded: boolean;
  machineState: string | null;
  currentSessionId: string | null;
  send: (event: HostOnboardingEvent) => void;
  onReconnectRequired: () => void;
};

type BaseNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

export function useFirmwareUpdateHandover({
  device,
  isDeviceOnboarded,
  machineState,
  currentSessionId,
  send,
  onReconnectRequired,
}: UseFirmwareUpdateHandoverInput) {
  const navigation = useNavigation<BaseNavigation>();
  const baseNavigation = navigation.getParent<BaseNavigation>(BASE_NAVIGATOR_ID) ?? navigation;
  const delegated = machineState === delegatedState;
  const pushedRef = useRef(false);
  const awaitingReturnRef = useRef(false);
  const closedRef = useRef(false);
  const freshResultRef = useRef(false);
  const delegatedRef = useRef(false);
  const wasDelegatedRef = useRef(false);
  const onReconnectRequiredRef = useRef(onReconnectRequired);
  const currentSessionIdRef = useRef(currentSessionId);

  useEffect(() => {
    if (delegated && !wasDelegatedRef.current) closedRef.current = false;
    wasDelegatedRef.current = delegated;
    delegatedRef.current = delegated;
  }, [delegated]);

  const {
    state: { deviceInfo, firmwareUpdateContext, status },
  } = useGetLatestAvailableFirmware({
    deviceId: device?.deviceId ?? "",
    deviceName: device?.deviceName ?? null,
    isHookEnabled: delegated && device !== null,
  });

  const closeHandoverOnce = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    awaitingReturnRef.current = false;
    send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
  }, [send]);

  const returnFromUpdate = useCallback(
    (rebooted: boolean) => {
      if (closedRef.current) return;
      if (!rebooted) {
        closeHandoverOnce();
        return;
      }
      closedRef.current = true;
      awaitingReturnRef.current = false;
      onReconnectRequiredRef.current();
    },
    [closeHandoverOnce],
  );

  const onBackFromUpdate = useCallback(
    (updateStep?: string) => {
      if (closedRef.current) return;
      awaitingReturnRef.current = false;
      baseNavigation.goBack();
      returnFromUpdate(updateStep === "completed" || currentSessionIdRef.current === null);
    },
    [baseNavigation, returnFromUpdate],
  );

  useEffect(() => {
    onReconnectRequiredRef.current = onReconnectRequired;
  }, [onReconnectRequired]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  useEffect(() => {
    if (!delegated) {
      freshResultRef.current = false;
      pushedRef.current = false;
      awaitingReturnRef.current = false;
      return;
    }

    if (!delegatedRef.current || closedRef.current) return;

    if (status === "idle" || status === "ongoing") {
      freshResultRef.current = true;
      return;
    }

    if (!freshResultRef.current || !device || pushedRef.current) return;

    if (status === "available-firmware" && deviceInfo && firmwareUpdateContext) {
      pushedRef.current = true;
      awaitingReturnRef.current = true;
      baseNavigation.push(ScreenName.FirmwareUpdate, {
        device,
        deviceInfo,
        firmwareUpdateContext,
        onBackFromUpdate,
        isBeforeOnboarding: true,
        isDeviceOnboarded,
      });
      return;
    }

    if (status === "error" || status === "no-available-firmware") {
      closeHandoverOnce();
    }
  }, [
    closeHandoverOnce,
    delegated,
    device,
    deviceInfo,
    firmwareUpdateContext,
    isDeviceOnboarded,
    baseNavigation,
    onBackFromUpdate,
    status,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (!awaitingReturnRef.current) return;
      returnFromUpdate(currentSessionIdRef.current === null);
    }, [returnFromUpdate]),
  );

  return { close: closeHandoverOnce };
}
