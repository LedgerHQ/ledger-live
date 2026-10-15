import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from "@react-navigation/native";
import {
  USB_COMPAT_DEVICE_ID_PREFIX,
  isUsbCompatDeviceId,
  useDeviceManagementKit,
} from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import type { ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import { useDeviceOnboarding } from "../../hooks/useDeviceOnboarding";
import { useOfferSync } from "../../hooks/useOfferSync";
import { toChecksError, toChecksScreenState, toFirmwareUpdate } from "../../utils/checksPhase";

type FunnelRoute = RouteProp<OnboardingNavigatorParamList, ScreenName.DeviceOnboardingFunnel>;

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
  const allKnownDevices = useSelector(knownDevicesSelector);
  const { pairedDeviceId, wasReadOnlyAtEntry } = useRoute<FunnelRoute>().params;
  const knownDevices = useMemo(() => {
    const paired = allKnownDevices.filter(known => matchesPairedDevice(known.id, pairedDeviceId));
    return paired.length > 0 ? paired : allKnownDevices;
  }, [allKnownDevices, pairedDeviceId]);
  const offerSync = useOfferSync();
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
  const send = onboarding.send;

  useEffect(() => {
    if (!sessionReady) return;
    send({ type: "SESSION_READY" });
  }, [send, sessionReady]);

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

  return {
    status: "checks",
    checks: {
      device,
      state: screenState,
      error: toChecksError(onboarding.state, readString(onboarding.context?.genuineFailureKind)),
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

function matchesPairedDevice(knownId: string, pairedDeviceId: string | undefined) {
  if (!pairedDeviceId) return false;
  if (knownId === pairedDeviceId) return true;
  const discoveryId = isUsbCompatDeviceId(pairedDeviceId)
    ? pairedDeviceId.slice(USB_COMPAT_DEVICE_ID_PREFIX.length)
    : pairedDeviceId;
  return knownId === discoveryId;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
