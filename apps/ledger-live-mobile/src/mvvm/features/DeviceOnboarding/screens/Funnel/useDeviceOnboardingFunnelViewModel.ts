import { useEffect, useRef, useState } from "react";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import { useDeviceOnboarding } from "../../hooks/useDeviceOnboarding";
import { useOfferSync } from "../../hooks/useOfferSync";
import { toChecksScreenState, toFirmwareUpdate, toGenuineError } from "../../utils/checksPhase";

export function useDeviceOnboardingFunnelViewModel(): ChecksScreenProps | null {
  const dmk = useDeviceManagementKit();
  const knownDevices = useSelector(knownDevicesSelector);
  const offerSync = useOfferSync();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [wasReadOnlyAtEntry] = useState(readOnlyModeEnabled);
  const onboarding = useDeviceOnboarding({
    dmk,
    knownDevices,
    offerSync,
    navigateOnExit: true,
    wasReadOnlyAtEntry,
  });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    onboarding.connect();
  }, [onboarding]);

  const screenState = toChecksScreenState(
    onboarding.state,
    onboarding.context?.checksPaused === true,
  );
  const device = onboarding.liveDevice;
  if (!device || !screenState) return null;

  const send = onboarding.send;

  return {
    device,
    state: screenState,
    error: toGenuineError(readString(onboarding.context?.genuineFailureKind)),
    update: toFirmwareUpdate(
      readString(onboarding.context?.firmwareVersion),
      readString(onboarding.context?.availableFirmwareVersion),
    ),
    onStart: () => send({ type: "CONTINUE" }),
    onContinue: () => send({ type: "CONTINUE" }),
    onRetry: () => send({ type: "RETRY" }),
    onCloseSheet: () => send({ type: "CLOSE" }),
    onAcceptUpdate: () => send({ type: "USER_ACCEPT" }),
    onDeclineUpdate: () => send({ type: "USER_DECLINE" }),
    onQuit: () => send({ type: "QUIT" }),
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
