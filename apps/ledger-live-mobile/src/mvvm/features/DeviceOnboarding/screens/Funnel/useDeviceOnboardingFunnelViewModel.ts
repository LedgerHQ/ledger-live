import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import { useDeviceOnboarding } from "../../hooks/useDeviceOnboarding";
import { useOfferSync } from "../../hooks/useOfferSync";
import { toChecksScreenState, toFirmwareUpdate, toGenuineError } from "../../utils/checksPhase";

export type DeviceOnboardingFunnelModel =
  | { status: "checks"; checks: ChecksScreenProps }
  | { status: "connecting"; title: string; closeLabel: string; onQuit: () => void }
  | {
      status: "failed";
      title: string;
      retryLabel: string;
      closeLabel: string;
      onRetry: () => void;
      onQuit: () => void;
    };

export function useDeviceOnboardingFunnelViewModel(): DeviceOnboardingFunnelModel {
  const dmk = useDeviceManagementKit();
  const knownDevices = useSelector(knownDevicesSelector);
  const offerSync = useOfferSync();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [wasReadOnlyAtEntry] = useState(readOnlyModeEnabled);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { t } = useTranslation();
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

  const sessionReady = onboarding.sendableEvents.some(
    ({ event }) => event.type === "SESSION_READY",
  );
  useEffect(() => {
    if (!sessionReady) return;
    onboarding.send({ type: "SESSION_READY" });
  }, [onboarding.send, sessionReady]);

  const leave = useCallback(() => {
    onboarding.reset();
    navigation.goBack();
  }, [navigation, onboarding]);

  const retry = useCallback(() => {
    onboarding.reset();
    onboarding.connect();
  }, [onboarding]);

  const screenState = toChecksScreenState(
    onboarding.state,
    onboarding.context?.checksPaused === true,
  );
  const device = onboarding.liveDevice;
  const closeLabel = t("deviceOnboarding.checks.close");

  if (!device || !screenState) {
    if (onboarding.error) {
      return {
        status: "failed",
        title: t("deviceOnboarding.connection.failed"),
        retryLabel: t("common.retry"),
        closeLabel,
        onRetry: retry,
        onQuit: leave,
      };
    }
    return {
      status: "connecting",
      title: t("deviceOnboarding.connection.connecting"),
      closeLabel,
      onQuit: leave,
    };
  }

  const send = onboarding.send;

  return {
    status: "checks",
    checks: {
      device,
      state: screenState,
      error: toGenuineError(readString(onboarding.context?.genuineFailureKind)),
      update: toFirmwareUpdate(
        readString(onboarding.context?.firmwareVersion),
        readString(onboarding.context?.availableFirmwareVersion),
      ),
      onStart: () =>
        send({ type: onboarding.state === "checks.checksIdle" ? "RETRY" : "CONTINUE" }),
      onContinue: () => send({ type: "CONTINUE" }),
      onRetry: () => send({ type: "RETRY" }),
      onCloseSheet: () => send({ type: "CLOSE" }),
      onAcceptUpdate: () => send({ type: "USER_ACCEPT" }),
      onDeclineUpdate: () => send({ type: "USER_DECLINE" }),
      onQuit: () => send({ type: "QUIT" }),
    },
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
