import { useEffect } from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  onboardingButtons,
  onboardingPages,
  trackOnboardingClick,
  trackOnboardingPage,
  type FunnelProps,
} from "@features/platform-device-onboarding-analytics";
import { trackUpdateOfferEvent } from "LLM/features/DeviceOnboarding/analytics/updateOfferTracking";
import { useTranslation } from "~/context/Locale";
import type { SessionReconnect } from "@features/flow-device-onboarding-reconnect";
import type { UpdateOfferSheetsProps } from "@features/flow-device-onboarding-update-offer";
import {
  useChecksErrorDrawers,
  useFirmwareUpdateRequest,
  type ChecksDrawerProps,
} from "LLM/features/DeviceOnboarding/components/ChecksDrawers/useChecksDrawers";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SetupStepperProps } from "@features/flow-device-onboarding-setup-stage";
import type { SetupInfoCard } from "@features/flow-device-onboarding-setup-info";
import type { SetupScreenProps } from "./types";

export type SetupViewProps = Omit<ChecksDrawerProps, "allowSheet" | "firmwareUpdate"> &
  Readonly<{
    infoCard: SetupInfoCard | undefined;
    suspendInfoSheet: boolean;
    reportsRecoveryKey: boolean;
    connection: SessionReconnect | null;
    updateOffer: UpdateOfferSheetsProps;
    productName: string;
    suspendSheets: boolean;
    deviceModelId: Device["modelId"];
    deviceName?: string;
    title: string;
    stepper: SetupStepperProps;
    closeLabel: string;
    onAskLeave?: () => void;
    startLabel?: string;
    onStart?: () => void;
    supportLabel?: string;
    onContactSupport?: () => void;
  }>;

export function useSetupScreenViewModel({
  device,
  stage,
  checks,
  onQuit,
  suspendSheets = false,
  reportsRecoveryKey = false,
  connection = null,
  firmwareDeclined = false,
  funnelProps = null,
}: SetupScreenProps): SetupViewProps {
  const { t } = useTranslation();

  const checksIdle = checks?.state === "idle";
  const pausedNotGenuine = checksIdle && checks.deviceNotGenuine;
  const productName = getDeviceModel(device.modelId).productName || device.modelId;
  const closeSheet = () => checks?.onCloseSheet();
  const quitAfterClosingError = () => {
    closeSheet();
    onQuit();
  };
  const { allowSheet: _allowSheet, ...errorDrawers } = useChecksErrorDrawers({
    device,
    state: checks?.state ?? null,
    error: checks?.error ?? null,
    onRetry: () => checks?.onRetry(),
    onCloseSheet: closeSheet,
    onErrorCancel: quitAfterClosingError,
    onSkipFirmwareCheck: checks?.onSkipFirmwareCheck,
    onAllowDismiss: onQuit,
    onNotGenuineClose: closeSheet,
    funnelProps,
    suspendSheets,
  });
  const offeredUpdate = checks?.state === "updating" ? checks.update : null;
  const { requestUpdate, unsupportedUpdate } = useFirmwareUpdateRequest({
    device,
    update: offeredUpdate,
    onAcceptUpdate: () => checks?.onAcceptUpdate(),
    onUnsupportedClosePressed: () => {
      if (funnelProps) trackOnboardingClick(onboardingButtons.close, funnelProps);
    },
    suspendSheets,
    updateAfterSetup: stage.kind === "osCheck",
  });
  useUnsupportedUpdatePage(unsupportedUpdate.isOpen, unsupportedUpdate.isUsbRequired, funnelProps);

  return {
    infoCard: stage.infoCard,
    suspendInfoSheet: suspendSheets || connection !== null,
    reportsRecoveryKey,
    connection,
    updateOffer: {
      update: offeredUpdate,
      confirmSkip: checks?.confirmSkipUpdate === true,
      suspendSheets: suspendSheets || connection !== null || unsupportedUpdate.mounted,
      onUpdate: requestUpdate,
      onSkip: () => checks?.onDeclineUpdate(),
      ...(funnelProps ? { onTrack: event => trackUpdateOfferEvent(event, funnelProps) } : {}),
    },
    productName,
    suspendSheets,
    deviceModelId: device.modelId,
    ...(device.deviceName ? { deviceName: device.deviceName } : {}),
    title: t("deviceOnboarding.setup.title"),
    stepper: {
      stage,
      checksIdle,
      notGenuine: pausedNotGenuine,
      firmwareDeclined,
      productName,
    },
    closeLabel: t("deviceOnboarding.checks.close"),
    onAskLeave: onQuit,
    ...(checksIdle && !pausedNotGenuine
      ? {
          startLabel: t("deviceOnboarding.checks.idle.cta"),
          onStart: () => {
            if (funnelProps) {
              trackOnboardingClick(onboardingButtons.initiateGenuineCheck, funnelProps);
            }
            checks.onStart();
          },
        }
      : {}),
    ...(pausedNotGenuine
      ? {
          supportLabel: t("earlySecurityCheck.genuineCheckNonGenuineDrawer.supportCta"),
          onContactSupport: errorDrawers.notGenuineDrawer.onContactSupport,
        }
      : {}),
    ...errorDrawers,
    unsupportedUpdate,
  };
}

function useUnsupportedUpdatePage(
  isOpen: boolean,
  isUsbRequired: boolean,
  funnelProps: FunnelProps | null,
) {
  useEffect(() => {
    if (!isOpen || !funnelProps) return;
    trackOnboardingPage(onboardingPages.osUpdateUnsupported, funnelProps, {
      reason: isUsbRequired ? "usb_required" : "not_eligible",
    });
  }, [isOpen, isUsbRequired, funnelProps]);
}
