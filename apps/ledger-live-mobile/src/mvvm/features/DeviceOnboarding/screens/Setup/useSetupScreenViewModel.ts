import { getDeviceModel } from "@ledgerhq/devices";
import { useTranslation } from "~/context/Locale";
import {
  useChecksDrawers,
  type ChecksDrawerProps,
} from "LLM/features/DeviceOnboarding/components/ChecksDrawers/useChecksDrawers";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SetupScreenProps } from "./types";
import type { SetupStage } from "./toSetupStage";

export type SetupStageStatus = "none" | "loading" | "success";

export type SetupViewProps = ChecksDrawerProps &
  Readonly<{
    deviceModelId: Device["modelId"];
    deviceName?: string;
    title: string;
    stageTitle: string;
    stageDescription?: string;
    currentStep: number;
    totalSteps: number;
    status: SetupStageStatus;
    closeLabel: string;
    onAskLeave?: () => void;
    startLabel?: string;
    onStart?: () => void;
    supportLabel?: string;
    onContactSupport?: () => void;
    reopenLabel?: string;
    onReopenFirmwareOffer?: () => void;
    skipUpdateLabel?: string;
    onSkipUpdate?: () => void;
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

function stageDescriptionKey(stage: SetupStage, status: SetupStageStatus) {
  switch (stage.kind) {
    case "checks":
      return status === "success"
        ? "deviceOnboarding.setup.checks.successDescription"
        : "deviceOnboarding.setup.checks.description";
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
}: SetupScreenProps): SetupViewProps {
  const { t } = useTranslation();
  const checksIdle = checks?.state === "idle";
  const pausedNotGenuine = checksIdle && checks.deviceNotGenuine;
  const status = stageStatus(stage, checksIdle);
  const descriptionKey = pausedNotGenuine
    ? "earlySecurityCheck.genuineCheckNonGenuineDrawer.title"
    : stageDescriptionKey(stage, status);
  const productName = getDeviceModel(device.modelId).productName || device.modelId;
  const closeSheet = () => checks?.onCloseSheet();
  const quitAfterClosingError = () => {
    closeSheet();
    onQuit();
  };
  const { headerQuitHidden, reopenFirmwareOffer, ...drawers } = useChecksDrawers({
    device,
    state: checks?.state ?? null,
    error: checks?.error ?? null,
    update: checks?.update ?? null,
    onRetry: () => checks?.onRetry(),
    onCloseSheet: closeSheet,
    onErrorCancel: quitAfterClosingError,
    onAcceptUpdate: () => checks?.onAcceptUpdate(),
    onAllowDismiss: onQuit,
    onNotGenuineClose: closeSheet,
    suspendSheets,
  });

  return {
    deviceModelId: device.modelId,
    ...(device.deviceName ? { deviceName: device.deviceName } : {}),
    title: t("deviceOnboarding.setup.title"),
    stageTitle: t(stageTitleKeys[stage.kind]),
    ...(descriptionKey ? { stageDescription: t(descriptionKey, { productName }) } : {}),
    currentStep: stage.index + 1,
    totalSteps: stage.total,
    status,
    closeLabel: t("deviceOnboarding.checks.close"),
    onAskLeave: headerQuitHidden ? undefined : onQuit,
    ...(checksIdle && !pausedNotGenuine
      ? { startLabel: t("deviceOnboarding.checks.idle.cta"), onStart: checks.onStart }
      : {}),
    ...(pausedNotGenuine
      ? {
          supportLabel: t("earlySecurityCheck.genuineCheckNonGenuineDrawer.supportCta"),
          onContactSupport: drawers.notGenuineDrawer.onContactSupport,
        }
      : {}),
    ...(checks?.state === "updating" &&
    checks.update &&
    !headerQuitHidden &&
    !drawers.unsupportedUpdate.mounted
      ? {
          reopenLabel: t("earlySecurityCheck.firmwareUpdateAvailableDrawer.updateCta"),
          onReopenFirmwareOffer: reopenFirmwareOffer,
          skipUpdateLabel: t("deviceOnboarding.checks.updating.skipCta"),
          onSkipUpdate: checks.onDeclineUpdate,
        }
      : {}),
    ...drawers,
  };
}
