import { getDeviceModel } from "@ledgerhq/devices";
import { useTranslation } from "~/context/Locale";
import type { SessionReconnect } from "@features/flow-device-onboarding-reconnect";
import type { UpdateOfferSheetsProps } from "@features/flow-device-onboarding-update-offer";
import {
  useChecksDrawers,
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
  const {
    headerQuitHidden,
    reopenFirmwareOffer: _reopenFirmwareOffer,
    allowSheet: _allowSheet,
    firmwareUpdate,
    ...drawers
  } = useChecksDrawers({
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
    infoCard: stage.infoCard,
    suspendInfoSheet: suspendSheets || connection !== null,
    reportsRecoveryKey,
    connection,
    updateOffer: {
      update: checks?.state === "updating" ? checks.update : null,
      confirmSkip: checks?.confirmSkipUpdate === true,
      suspendSheets: suspendSheets || connection !== null || drawers.unsupportedUpdate.mounted,
      onUpdate: firmwareUpdate.onUpdate,
      onSkip: () => checks?.onDeclineUpdate(),
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
    ...drawers,
  };
}
