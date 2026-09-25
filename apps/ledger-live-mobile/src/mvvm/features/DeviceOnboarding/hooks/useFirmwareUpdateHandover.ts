import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingEvent } from "@ledgerhq/device-onboarding";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";

const delegatedState = "checks.firmwareUpdateDelegated";

type UseFirmwareUpdateHandoverInput = {
  device: Device | null;
  machineState: string | null;
  send: (event: OnboardingEvent) => void;
};

type BaseNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

export function useFirmwareUpdateHandover({
  device,
  machineState,
  send,
}: UseFirmwareUpdateHandoverInput) {
  const navigation = useNavigation<BaseNavigation>();
  const baseNavigation = navigation.getParent(BASE_NAVIGATOR_ID) ?? navigation;
  const delegated = machineState === delegatedState;
  const pushedRef = useRef(false);
  const awaitingReturnRef = useRef(false);
  const closedRef = useRef(false);
  const freshResultRef = useRef(false);

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

  const onBackFromUpdate = useCallback(() => {
    if (closedRef.current) return;
    baseNavigation.goBack();
    closeHandoverOnce();
  }, [baseNavigation, closeHandoverOnce]);

  useEffect(() => {
    if (!delegated) {
      freshResultRef.current = false;
      pushedRef.current = false;
      awaitingReturnRef.current = false;
      closedRef.current = false;
      return;
    }

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
    baseNavigation,
    onBackFromUpdate,
    status,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (awaitingReturnRef.current) closeHandoverOnce();
    }, [closeHandoverOnce]),
  );
}
