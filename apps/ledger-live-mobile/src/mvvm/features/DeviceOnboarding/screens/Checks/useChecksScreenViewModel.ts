import { useTranslation } from "~/context/Locale";
import {
  useChecksDrawers,
  type ChecksDrawerProps,
} from "LLM/features/DeviceOnboarding/components/ChecksDrawers/useChecksDrawers";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { ChecksScreenProps, ChecksScreenState } from "LLM/features/DeviceOnboarding/types";

export type ChecksIllustration = "loading" | "scan" | "success";

export type ChecksViewProps = ChecksDrawerProps &
  Readonly<{
    illustration?: ChecksIllustration;
    title: string;
    description?: string;
    primaryLabel?: string;
    primaryTestID?: string;
    primaryLoading?: boolean;
    onPrimary?: () => void;
    onQuit?: () => void;
    closeLabel: string;
  }>;

type ChecksLayout = Exclude<ChecksScreenState, "awaitingAllow" | "updating">;

type LayoutProps = Omit<ChecksViewProps, keyof ChecksDrawerProps | "onQuit" | "closeLabel">;

function checksLayout(state: ChecksScreenState): ChecksLayout {
  if (state === "awaitingAllow" || state === "updating") return "checking";
  return state;
}

export function useChecksScreenViewModel({
  device,
  state,
  error,
  update,
  firmwareUpToDate,
  onStart,
  onRetry,
  onCloseSheet,
  onCloseNotGenuine,
  onCloseFirmwareOffer,
  onContinue,
  onQuit,
  onAcceptUpdate,
  onDeclineUpdate,
}: ChecksScreenProps): ChecksViewProps {
  const { t } = useTranslation();
  const layout = checksLayout(state);
  const { headerQuitHidden, ...drawers } = useChecksDrawers({
    device,
    state,
    error,
    update,
    onRetry,
    onCloseSheet,
    onErrorCancel: () => onQuit?.(),
    onAcceptUpdate,
    onDeclineUpdate,
    onAllowDismiss: () => onQuit?.(),
    onNotGenuineClose: () => {
      if (onCloseNotGenuine) {
        onCloseNotGenuine();
        return;
      }
      onQuit?.();
    },
    onCloseFirmwareOffer,
  });

  const layouts: Record<ChecksLayout, LayoutProps> = {
    synchronizing: {
      illustration: "loading",
      title: t("deviceOnboarding.checks.synchronizing.title"),
    },
    idle: {
      illustration: "scan",
      title: t("deviceOnboarding.checks.idle.title"),
      description: t("deviceOnboarding.checks.idle.description"),
      primaryLabel: t("deviceOnboarding.checks.idle.cta"),
      primaryTestID: checksTestIds.start,
      onPrimary: onStart,
    },
    checking: {
      illustration: "scan",
      title: t("deviceOnboarding.checks.checking.title"),
      description: t("deviceOnboarding.checks.checking.description"),
      primaryLabel: t("deviceOnboarding.checks.checking.cta"),
      primaryLoading: true,
    },
    succeeded: {
      illustration: "success",
      title: t(
        firmwareUpToDate
          ? "deviceOnboarding.checks.succeeded.title"
          : "deviceOnboarding.checks.succeeded.genuineTitle",
      ),
      primaryLabel: t("deviceOnboarding.checks.succeeded.cta"),
      primaryTestID: checksTestIds.continue,
      ...(onContinue ? { onPrimary: onContinue } : { primaryLoading: true }),
    },
  };

  return {
    ...layouts[layout],
    closeLabel: t("deviceOnboarding.checks.close"),
    onQuit: headerQuitHidden ? undefined : onQuit,
    ...drawers,
  };
}
