import { useCallback, useEffect, useRef, useState } from "react";
import manager from "@ledgerhq/live-common/manager/index";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { OnboardingEvent } from "@features/platform-device-onboarding";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useKeepScreenAwake } from "~/renderer/hooks/useKeepScreenAwake";
import UpdateFirmwareModal from "~/renderer/modals/UpdateFirmwareModal";
import { initialStepId } from "~/renderer/screens/manager/FirmwareUpdate";

export const firmwareUpdateDelegatedState = "checks.firmwareUpdateDelegated";

type UseFirmwareUpdateHandoverInput = {
  device: Device | null;
  machineState: string | null;
  send: (event: OnboardingEvent) => void;
};

export function useFirmwareUpdateHandover({
  device,
  machineState,
  send,
}: UseFirmwareUpdateHandoverInput) {
  const delegated = machineState === firmwareUpdateDelegatedState;
  const closedRef = useRef(false);
  const freshResultRef = useRef(false);
  const ownsDrawerRef = useRef(false);
  const generationRef = useRef(0);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [trackedDelegated, setTrackedDelegated] = useState(delegated);
  const [holdingDrawer, setHoldingDrawer] = useState(false);
  useKeepScreenAwake(holdingDrawer);

  if (delegated !== trackedDelegated) {
    setTrackedDelegated(delegated);
    setDrawerOpened(false);
    if (!delegated) setHoldingDrawer(false);
  }

  const {
    state: { deviceInfo, firmwareUpdateContext, status },
  } = useGetLatestAvailableFirmware({
    deviceId: device?.deviceId ?? "",
    deviceName: device?.deviceName ?? null,
    isHookEnabled: delegated && device !== null && !drawerOpened,
  });

  const releaseFirmwareDrawer = useCallback(() => {
    generationRef.current += 1;
    if (!ownsDrawerRef.current) return;
    ownsDrawerRef.current = false;
    setHoldingDrawer(false);
    setDrawer();
  }, []);

  const finishHandover = useCallback(
    (generation: number) => {
      if (generation !== generationRef.current || closedRef.current) return;
      closedRef.current = true;
      send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
    },
    [send],
  );

  const closeOwnedDrawer = useCallback(
    (generation: number) => {
      if (generation !== generationRef.current || closedRef.current) return;
      closedRef.current = true;
      setHoldingDrawer(false);
      if (ownsDrawerRef.current) {
        ownsDrawerRef.current = false;
        setDrawer();
      }
      send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
    },
    [send],
  );

  useEffect(() => {
    if (!delegated) {
      closedRef.current = false;
      freshResultRef.current = false;
      generationRef.current += 1;
      if (ownsDrawerRef.current) {
        ownsDrawerRef.current = false;
        setDrawer();
      }
      return;
    }

    if (status === "idle" || status === "ongoing") {
      freshResultRef.current = true;
      return;
    }

    if (!freshResultRef.current || !device || drawerOpened) return;

    if (status === "error" || status === "no-available-firmware") {
      finishHandover(generationRef.current);
      return;
    }

    if (status !== "available-firmware" || !deviceInfo || !firmwareUpdateContext) {
      return;
    }

    const generation = generationRef.current;
    ownsDrawerRef.current = true;
    setDrawerOpened(true);
    setHoldingDrawer(true);
    setDrawer(
      UpdateFirmwareModal,
      {
        withAppsToReinstall: false,
        withResetStep: manager.firmwareUpdateNeedsLegacyBlueResetInstructions(
          deviceInfo,
          device.modelId,
        ),
        onDrawerClose: () => closeOwnedDrawer(generation),
        onRequestClose: () => closeOwnedDrawer(generation),
        firmware: firmwareUpdateContext,
        stepId: initialStepId({ deviceInfo, device }),
        deviceModelId: device.modelId,
        deviceInfo,
        device,
        installed: [],
        setFirmwareUpdateCompleted: () => undefined,
      },
      {
        preventBackdropClick: true,
        forceDisableFocusTrap: true,
        withPaddingTop: false,
        onRequestClose: undefined,
      },
    );
  }, [
    closeOwnedDrawer,
    delegated,
    device,
    deviceInfo,
    drawerOpened,
    finishHandover,
    firmwareUpdateContext,
    status,
  ]);

  useEffect(
    () => () => {
      generationRef.current += 1;
      if (!ownsDrawerRef.current) return;
      ownsDrawerRef.current = false;
      setDrawer();
    },
    [],
  );

  return releaseFirmwareDrawer;
}
