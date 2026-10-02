import { useCallback, useEffect, useRef, useState } from "react";
import manager from "@ledgerhq/live-common/manager/index";
import { useGetLatestAvailableFirmware } from "@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { OnboardingEvent } from "@ledgerhq/device-onboarding";
import { setDrawer } from "~/renderer/drawers/Provider";
import UpdateFirmwareModal from "~/renderer/modals/UpdateFirmwareModal";
import { initialStepId } from "~/renderer/screens/manager/FirmwareUpdate";

const delegatedState = "checks.firmwareUpdateDelegated";

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
  const delegated = machineState === delegatedState;
  const closedRef = useRef(false);
  const freshResultRef = useRef(false);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [trackedDelegated, setTrackedDelegated] = useState(delegated);
  if (delegated !== trackedDelegated) {
    setTrackedDelegated(delegated);
    setDrawerOpened(false);
  }

  const {
    state: { deviceInfo, firmwareUpdateContext, status },
  } = useGetLatestAvailableFirmware({
    deviceId: device?.deviceId ?? "",
    deviceName: device?.deviceName ?? null,
    isHookEnabled: delegated && device !== null && !drawerOpened,
  });

  const closeOnce = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    setDrawer();
    send({ type: "FIRMWARE_UPDATE_FLOW_CLOSED" });
  }, [send]);

  useEffect(() => {
    if (!delegated) {
      closedRef.current = false;
      freshResultRef.current = false;
      return;
    }

    if (status === "idle" || status === "ongoing") {
      freshResultRef.current = true;
      return;
    }

    if (!freshResultRef.current || !device || drawerOpened) return;

    if (status === "error" || status === "no-available-firmware") {
      closeOnce();
      return;
    }

    if (status !== "available-firmware" || !deviceInfo || !firmwareUpdateContext) {
      return;
    }

    setDrawerOpened(true);
    setDrawer(
      UpdateFirmwareModal,
      {
        withAppsToReinstall: false,
        withResetStep: manager.firmwareUpdateNeedsLegacyBlueResetInstructions(
          deviceInfo,
          device.modelId,
        ),
        onDrawerClose: () => closeOnce(),
        onRequestClose: () => closeOnce(),
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
  }, [closeOnce, delegated, device, deviceInfo, drawerOpened, firmwareUpdateContext, status]);
}
