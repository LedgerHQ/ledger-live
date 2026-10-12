import { useTranslation } from "~/context/Locale";
import type { ChecksScreenProps, ChecksScreenState } from "LLM/features/DeviceOnboarding/types";
import { checksTestIds } from "LLM/features/DeviceOnboarding/testIds";

type AllowSheetProps = Readonly<{
  title: string;
  description: string;
  onClose: () => void;
}>;

export type ChecksViewProps = Readonly<{
  title: string;
  description?: string;
  primaryLabel?: string;
  primaryTestID?: string;
  onPrimary?: () => void;
  onQuit?: () => void;
  closeLabel: string;
  allowSheet?: AllowSheetProps;
}>;

type ChecksLayout = Exclude<ChecksScreenState, "awaitingAllow">;

function checksLayout(state: ChecksScreenState): ChecksLayout {
  if (state === "awaitingAllow") return "checking";
  return state;
}

export function useChecksScreenViewModel({
  state,
  onStart,
  onCloseSheet,
  onContinue,
  onQuit,
}: ChecksScreenProps): ChecksViewProps {
  const { t } = useTranslation();
  const layout = checksLayout(state);

  const copy = {
    idle: {
      title: t("deviceOnboarding.checks.idle.title"),
      description: t("deviceOnboarding.checks.idle.description"),
      primaryLabel: t("deviceOnboarding.checks.idle.cta"),
      primaryTestID: checksTestIds.start,
      onPrimary: onStart,
    },
    checking: {
      title: t("deviceOnboarding.checks.checking.title"),
      description: t("deviceOnboarding.checks.checking.description"),
    },
    succeeded: {
      title: t("deviceOnboarding.checks.succeeded.title"),
      description: t("deviceOnboarding.checks.succeeded.description"),
      primaryLabel: t("deviceOnboarding.checks.succeeded.cta"),
      primaryTestID: checksTestIds.continue,
      onPrimary: onContinue,
    },
    updating: {
      title: t("deviceOnboarding.checks.updating.title"),
    },
  }[layout];

  return {
    ...copy,
    closeLabel: t("deviceOnboarding.checks.close"),
    onQuit: layout === "updating" ? undefined : onQuit,
    allowSheet:
      state === "awaitingAllow"
        ? {
            title: t("deviceOnboarding.checks.allow.title"),
            description: t("deviceOnboarding.checks.allow.description"),
            onClose: onCloseSheet,
          }
        : undefined,
  };
}
