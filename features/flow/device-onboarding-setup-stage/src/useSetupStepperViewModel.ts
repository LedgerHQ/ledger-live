import { useTranslation } from "@shared/i18n";
import type { SetupStepperProps } from "./SetupStepper.types";
import type { SetupIndicator, SetupStage } from "./toSetupStage";

export type SetupStepperViewProps = Readonly<{
  stageKind: SetupStage["kind"];
  label: string;
  completedSteps: number;
  totalSteps: number;
  title: string;
  description?: string;
  status: SetupIndicator;
}>;

function checksDescriptionKey(status: SetupIndicator, firmwareDeclined: boolean) {
  if (status !== "success") return "deviceOnboarding.setup.checks.description";
  return firmwareDeclined
    ? "deviceOnboarding.setup.checks.notUpToDateDescription"
    : "deviceOnboarding.setup.checks.successDescription";
}

function genuineDescriptionKey(status: SetupIndicator) {
  return status === "success"
    ? "deviceOnboarding.setup.genuine.successDescription"
    : "deviceOnboarding.setup.genuine.description";
}

function osCheckDescriptionKey(status: SetupIndicator, firmwareDeclined: boolean) {
  if (status !== "success") return "deviceOnboarding.setup.osCheck.description";
  return firmwareDeclined ? "deviceOnboarding.setup.checks.notUpToDateDescription" : null;
}

function stageDescriptionKey(stage: SetupStage, status: SetupIndicator, firmwareDeclined: boolean) {
  switch (stage.kind) {
    case "checks":
      return checksDescriptionKey(status, firmwareDeclined);
    case "genuine":
      return genuineDescriptionKey(status);
    case "osCheck":
      return osCheckDescriptionKey(status, firmwareDeclined);
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

export function useSetupStepperViewModel({
  stage,
  checksIdle,
  notGenuine,
  firmwareDeclined,
  productName,
}: SetupStepperProps): SetupStepperViewProps {
  const { t } = useTranslation();
  const status = checksIdle ? "none" : stage.indicator;
  const descriptionKey =
    checksIdle && notGenuine
      ? "earlySecurityCheck.genuineCheckNonGenuineDrawer.title"
      : stageDescriptionKey(stage, status, firmwareDeclined);

  return {
    stageKind: stage.kind,
    label: `${stage.index + 1}/${stage.total}`,
    completedSteps: stage.index,
    totalSteps: stage.total,
    title: t(`deviceOnboarding.setup.${stage.kind}.title`),
    ...(descriptionKey ? { description: t(descriptionKey, { productName }) } : {}),
    status,
  };
}
