import { useEffect, useRef, useState } from "react";
import { useTranslation } from "~/context/Locale";
import {
  useChecksDrawers,
  type ChecksDrawerProps,
} from "LLM/features/DeviceOnboarding/components/ChecksDrawers/useChecksDrawers";
import type { SetupScreenProps } from "./types";
import type { SetupStage, SetupStageKind } from "./toSetupStage";

type QuitConfirmationProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  continueLabel: string;
  leaveLabel: string;
  onContinue: () => void;
  onLeave: () => void;
}>;

export type SetupViewProps = ChecksDrawerProps &
  Readonly<{
    title: string;
    description: string;
    progress: string;
    indicatorLabel?: string;
    closeLabel: string;
    onAskLeave?: () => void;
    startLabel?: string;
    onStart?: () => void;
    quitConfirmation: QuitConfirmationProps;
  }>;

const stageCopy = {
  checks: {
    title: "deviceOnboarding.setup.checks.title",
    description: "deviceOnboarding.setup.checks.description",
  },
  naming: {
    title: "deviceOnboarding.setup.naming.title",
    description: "deviceOnboarding.setup.naming.description",
  },
  pin: {
    title: "deviceOnboarding.setup.pin.title",
    description: "deviceOnboarding.setup.pin.description",
  },
  setupChoice: {
    title: "deviceOnboarding.setup.setupChoice.title",
    description: "deviceOnboarding.setup.setupChoice.description",
  },
  security: {
    title: "deviceOnboarding.setup.security.title",
    description: "deviceOnboarding.setup.security.description",
  },
  restore: {
    title: "deviceOnboarding.setup.restore.title",
    description: "deviceOnboarding.setup.restore.description",
  },
} as const satisfies Record<SetupStageKind, { title: string; description: string }>;

const indicatorCopy = {
  loading: "deviceOnboarding.setup.indicator.loading",
  upToDate: "deviceOnboarding.checks.succeeded.title",
  genuine: "deviceOnboarding.checks.succeeded.genuineTitle",
} as const;

function indicatorCopyKey(stage: SetupStage, checksIdle: boolean, firmwareUpToDate: boolean) {
  if (stage.indicator === "none" || checksIdle) return null;
  if (stage.indicator === "loading") return indicatorCopy.loading;
  return firmwareUpToDate ? indicatorCopy.upToDate : indicatorCopy.genuine;
}

export function useSetupScreenViewModel({
  device,
  stage,
  checks,
  firmwareUpToDate,
  leaveRequest,
  onLeave,
}: SetupScreenProps): SetupViewProps {
  const { t } = useTranslation();
  const copy = stageCopy[stage.kind];
  const descriptionKey =
    stage.detail === "recoveryKey"
      ? "deviceOnboarding.setup.security.recoveryKeyDescription"
      : copy.description;
  const [quitOpen, setQuitOpen] = useState(false);
  const appliedLeaveRequest = useRef(leaveRequest);
  const askLeave = () => setQuitOpen(true);

  useEffect(() => {
    if (leaveRequest === appliedLeaveRequest.current) return;
    appliedLeaveRequest.current = leaveRequest;
    setQuitOpen(true);
  }, [leaveRequest]);
  const closeSheet = () => checks?.onCloseSheet();
  const askLeaveAfterClosingError = () => {
    closeSheet();
    askLeave();
  };
  const { headerQuitHidden, ...drawers } = useChecksDrawers({
    device,
    state: checks?.state ?? null,
    error: checks?.error ?? null,
    update: checks?.update ?? null,
    onRetry: () => checks?.onRetry(),
    onCloseSheet: closeSheet,
    onErrorCancel: askLeaveAfterClosingError,
    onAcceptUpdate: () => checks?.onAcceptUpdate(),
    onDeclineUpdate: () => checks?.onDeclineUpdate(),
    onAllowDismiss: askLeave,
    onNotGenuineClose: closeSheet,
    onCloseFirmwareOffer: checks?.onCloseFirmwareOffer,
    hideAllowSheet: quitOpen,
    resumeAllowSheet: true,
  });
  const indicatorKey = indicatorCopyKey(stage, checks?.state === "idle", firmwareUpToDate);

  return {
    title: t(copy.title),
    description: t(descriptionKey),
    progress: t("deviceOnboarding.setup.progress", {
      current: stage.index + 1,
      total: stage.total,
    }),
    ...(indicatorKey ? { indicatorLabel: t(indicatorKey) } : {}),
    closeLabel: t("deviceOnboarding.checks.close"),
    onAskLeave: headerQuitHidden ? undefined : askLeave,
    ...(checks?.state === "idle"
      ? { startLabel: t("deviceOnboarding.checks.idle.cta"), onStart: checks.onStart }
      : {}),
    ...drawers,
    quitConfirmation: {
      isOpen: quitOpen,
      title: t("deviceOnboarding.setup.quit.title"),
      description: t("deviceOnboarding.setup.quit.description"),
      continueLabel: t("deviceOnboarding.setup.quit.continue"),
      leaveLabel: t("deviceOnboarding.setup.quit.leave"),
      onContinue: () => setQuitOpen(false),
      onLeave: () => {
        setQuitOpen(false);
        onLeave();
      },
    },
  };
}
