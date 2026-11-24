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
import type { SetupScreenProps } from "./types";
import type { SetupStage } from "./toSetupStage";
import type { SetupInfoCard } from "@features/flow-device-onboarding-setup-info";

export type SetupStageStatus = "none" | "loading" | "success";

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
    stageTitle: string;
    stageDescription?: string;
    currentStep: number;
    completedSteps: number;
    totalSteps: number;
    status: SetupStageStatus;
    closeLabel: string;
    onAskLeave?: () => void;
    startLabel?: string;
    onStart?: () => void;
    supportLabel?: string;
    onContactSupport?: () => void;
  }>;

const stageTitleKeys = {
  checks: "deviceOnboarding.setup.checks.title",
  naming: "deviceOnboarding.setup.naming.title",
  pin: "deviceOnboarding.setup.pin.title",
  setupChoice: "deviceOnboarding.setup.setupChoice.title",
  security: "deviceOnboarding.setup.security.title",
  restore: "deviceOnboarding.setup.restore.title",
} as const satisfies Record<SetupStage["kind"], string>;

function stageStatus(stage: SetupStage, checksIdle: boolean): SetupStageStatus {
  if (checksIdle) return "none";
  return stage.indicator;
}

function checksDescriptionKey(status: SetupStageStatus, firmwareDeclined: boolean) {
  if (status !== "success") return "deviceOnboarding.setup.checks.description";
  return firmwareDeclined
    ? "deviceOnboarding.setup.checks.notUpToDateDescription"
    : "deviceOnboarding.setup.checks.successDescription";
}

function stageDescriptionKey(
  stage: SetupStage,
  status: SetupStageStatus,
  firmwareDeclined: boolean,
) {
  switch (stage.kind) {
    case "checks":
      return checksDescriptionKey(status, firmwareDeclined);
    case "naming":
      return "deviceOnboarding.setup.naming.description";
    case "pin":
      return "deviceOnboarding.setup.pin.description";
    case "security":
      return stage.detail === "recoveryKey"
        ? "deviceOnboarding.setup.security.recoveryKeyDescription"
        : "deviceOnboarding.setup.security.description";
    case "restore":
      return stage.detail === "recoveryPhrase"
        ? "deviceOnboarding.setup.restore.recoveryPhraseDescription"
        : null;
    case "setupChoice":
      return null;
  }
}

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
  const status = stageStatus(stage, checksIdle);
  const descriptionKey = pausedNotGenuine
    ? "earlySecurityCheck.genuineCheckNonGenuineDrawer.title"
    : stageDescriptionKey(stage, status, firmwareDeclined);
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
    stageTitle: t(stageTitleKeys[stage.kind]),
    ...(descriptionKey ? { stageDescription: t(descriptionKey, { productName }) } : {}),
    currentStep: stage.index + 1,
    completedSteps: stage.index,
    totalSteps: stage.total,
    status,
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
