import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from "@react-navigation/native";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import type { ScreenName } from "~/const";
import type { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import {
  useDeviceOnboardingHost,
  useDeviceOnboardingSession,
} from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useOfferSync } from "LLM/features/DeviceOnboarding/hooks/useOfferSync";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import { toChecksError, toFirmwareUpdate } from "LLM/features/DeviceOnboarding/utils/checksPhase";
import { checksScreenForPhase, phaseOf } from "LLM/features/DeviceOnboarding/utils/funnelPhase";
import { selectPairedKnownDevices } from "LLM/features/DeviceOnboarding/utils/pairedDevice";
import { useFirmwareUpdateHandover } from "LLM/features/DeviceOnboarding/hooks/useFirmwareUpdateHandover";
import { lastSavedStepName } from "../../components/QuitConfirmation/lastSavedStep";

type FunnelRoute = RouteProp<OnboardingNavigatorParamList, ScreenName.DeviceOnboardingFunnel>;

const firmwareUpdateDelegatedState = "checks.firmwareUpdateDelegated";
const awaitingSessionAfterFirmwareUpdateState = "awaitingSessionAfterFirmwareUpdate";

/** Back must not quit here: a quit would skip the update and complete onboarding. */
const firmwareUpdateOfferState = "checks.firmwareUpdateOffered";

export type QuitConfirmationModel = {
  isOpen: boolean;
  stepName: string;
  onContinue: () => void;
  onLeave: () => void;
};

export type DeviceOnboardingFunnelModel = (
  | { status: "karaoke"; onClose: () => void }
  | { status: "checks"; checks: ChecksScreenProps }
  | { status: "connecting"; title: string; closeLabel: string; onQuit: () => void }
  | {
      status: "failed";
      title: string;
      retryLabel: string;
      closeLabel: string;
      onRetry: () => void;
      onQuit: () => void;
    }
) & { quitConfirmation: QuitConfirmationModel | null };

export function useDeviceOnboardingFunnelViewModel(): DeviceOnboardingFunnelModel {
  const dmk = useDeviceManagementKit();
  const allKnownDevices = useSelector(knownDevicesSelector);
  const { pairedDeviceId, wasReadOnlyAtEntry } = useRoute<FunnelRoute>().params;
  const knownDevices = useMemo(
    () => selectPairedKnownDevices(allKnownDevices, pairedDeviceId),
    [allKnownDevices, pairedDeviceId],
  );
  const offerSync = useOfferSync();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { t } = useTranslation();
  const allowLeave = useRef(false);
  const quitSent = useRef(false);
  const [quitConfirmationOpen, setQuitConfirmationOpen] = useState(false);
  const onLeave = useCallback(() => {
    allowLeave.current = true;
  }, []);
  const onboarding = useDeviceOnboardingSession();
  const host = useMemo(
    () => ({
      navigation,
      onLeave,
      dmk,
      knownDevices,
      offerSync,
      wasReadOnlyAtEntry,
    }),
    [dmk, knownDevices, navigation, offerSync, onLeave, wasReadOnlyAtEntry],
  );
  useDeviceOnboardingHost(host);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (onboarding.status !== "idle" || onboarding.state !== null || onboarding.error) return;
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
    allowLeave.current = true;
    onboarding.reset();
    navigation.goBack();
  }, [navigation, onboarding]);

  const leaveFirmwareReconnect = useCallback(() => {
    allowLeave.current = true;
    onboarding.abortFirmwareReconnect();
  }, [onboarding]);

  const quitMachine = useCallback(() => {
    send({ type: "QUIT" });
  }, [send]);

  const { close: closeFirmwareHandover } = useFirmwareUpdateHandover({
    device: onboarding.liveDevice,
    isDeviceOnboarded: onboarding.context?.isOnboarded ?? false,
    machineState: onboarding.state,
    currentSessionId: onboarding.device?.sessionId ?? null,
    send: onboarding.send,
    onReconnectRequired: onboarding.reconnectAfterUpdate,
  });

  const requestQuit = useCallback(() => {
    setQuitConfirmationOpen(true);
  }, []);

  const continueSetup = useCallback(() => {
    setQuitConfirmationOpen(false);
  }, []);

  const leaveWithoutSaving = useCallback(() => {
    if (quitSent.current) return;
    quitSent.current = true;
    setQuitConfirmationOpen(false);
    send({ type: "QUIT" });
  }, [send]);

  const unseeded = onboarding.context?.onboardedOnEntry === false;

  const quitOrLeave = useCallback(() => {
    if (onboarding.status === "running" && onboarding.state) {
      if (onboarding.context?.onboardedOnEntry === false) {
        requestQuit();
        return;
      }
      quitMachine();
      return;
    }
    leave();
  }, [
    leave,
    onboarding.context?.onboardedOnEntry,
    onboarding.state,
    onboarding.status,
    quitMachine,
    requestQuit,
  ]);

  const retry = useCallback(() => {
    onboarding.reset();
    onboarding.connect();
  }, [onboarding]);

  const reconnect = useCallback(() => {
    onboarding.connect();
  }, [onboarding]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", event => {
        if (allowLeave.current) return;
        const action = event.data.action.type;
        if (action !== "GO_BACK" && action !== "POP") return;
        event.preventDefault();
        if (onboarding.state === awaitingSessionAfterFirmwareUpdateState) {
          leaveFirmwareReconnect();
          return;
        }
        if (onboarding.status === "running" && onboarding.state) {
          if (onboarding.state === firmwareUpdateDelegatedState) closeFirmwareHandover();
          else if (onboarding.context?.onboardedOnEntry === false) requestQuit();
          else if (onboarding.state !== firmwareUpdateOfferState) quitMachine();
          return;
        }
        leave();
      }),
    [
      closeFirmwareHandover,
      leave,
      leaveFirmwareReconnect,
      navigation,
      onboarding.context?.onboardedOnEntry,
      onboarding.state,
      onboarding.status,
      quitMachine,
      requestQuit,
    ],
  );

  const onboardedOnEntry = onboarding.context?.onboardedOnEntry ?? null;
  const phase = phaseOf(onboarding.state, onboardedOnEntry);
  const screenState = checksScreenForPhase(
    phase,
    onboarding.state,
    onboarding.context?.checksPaused === true,
    onboardedOnEntry === true,
  );
  const device = onboarding.liveDevice;
  const closeLabel = t("deviceOnboarding.checks.close");
  const quitConfirmation = unseeded
    ? {
        isOpen: quitConfirmationOpen,
        stepName: lastSavedStepName(onboarding.state, onboarding.context?.currentSetupStep, t),
        onContinue: continueSetup,
        onLeave: leaveWithoutSaving,
      }
    : null;
  const leaveFromHeader = unseeded ? requestQuit : quitMachine;

  if (onboarding.state === awaitingSessionAfterFirmwareUpdateState) {
    if (onboarding.error) {
      return {
        status: "failed",
        title: t("deviceOnboarding.connection.failed"),
        retryLabel: t("common.retry"),
        closeLabel,
        onRetry: reconnect,
        onQuit: leaveFirmwareReconnect,
        quitConfirmation,
      };
    }
    return {
      status: "connecting",
      title: t("deviceOnboarding.connection.connecting"),
      closeLabel,
      onQuit: leaveFirmwareReconnect,
      quitConfirmation,
    };
  }

  if (onboarding.state === "awaitingSession") {
    return {
      status: "failed",
      title: t("deviceOnboarding.connection.failed"),
      retryLabel: t("common.retry"),
      closeLabel,
      onRetry: reconnect,
      onQuit: leaveFromHeader,
      quitConfirmation,
    };
  }

  if (!device || !screenState) {
    if (onboarding.error) {
      return {
        status: "failed",
        title: t("deviceOnboarding.connection.failed"),
        retryLabel: t("common.retry"),
        closeLabel,
        onRetry: retry,
        onQuit: quitOrLeave,
        quitConfirmation,
      };
    }
    return {
      status: "connecting",
      title: t("deviceOnboarding.connection.connecting"),
      closeLabel,
      onQuit: quitOrLeave,
      quitConfirmation,
    };
  }

  if (unseeded && onboarding.state === "awaitingStart") {
    return {
      status: "karaoke",
      onClose: requestQuit,
      quitConfirmation,
    };
  }

  return {
    status: "checks",
    quitConfirmation,
    checks: {
      device,
      state: screenState,
      error: toChecksError(onboarding.state, readString(onboarding.context?.genuineFailureKind)),
      update:
        phase === "checks"
          ? toFirmwareUpdate(
              readString(onboarding.context?.firmwareVersion),
              readString(onboarding.context?.availableFirmwareVersion),
            )
          : null,
      firmwareUpToDate: onboarding.context?.firmwareUpToDate === true,
      onStart: () =>
        send({ type: onboarding.state === "checks.checksIdle" ? "RETRY" : "CONTINUE" }),
      onRetry: () => send({ type: "RETRY" }),
      onCloseSheet: () => send({ type: "CLOSE" }),
      onCloseNotGenuine: unseeded ? () => send({ type: "CLOSE" }) : undefined,
      onCloseFirmwareOffer: unseeded ? () => send({ type: "CLOSE" }) : undefined,
      onAcceptUpdate: () => send({ type: "USER_ACCEPT" }),
      onDeclineUpdate: () => send({ type: "USER_DECLINE" }),
      onContinue:
        onboarding.state === "checks.checksSucceeded"
          ? () => send({ type: "CONTINUE" })
          : undefined,
      onQuit:
        onboarding.state === firmwareUpdateDelegatedState ? closeFirmwareHandover : leaveFromHeader,
    },
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
