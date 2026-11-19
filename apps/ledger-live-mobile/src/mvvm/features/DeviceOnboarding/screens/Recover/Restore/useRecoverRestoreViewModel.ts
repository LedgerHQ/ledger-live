import { track } from "@shared/analytics";
import { useTranslation } from "~/context/Locale";

export const restoreWithRecoverPage = "Onboarding - Restore with Recover";
const continueToRecoverButton = "Continue to Ledger Recover";
const closeButton = "close";

const restoreEventProps = {
  sourceFlow: "onboarding",
  source: "Onboarding - Restore",
  seedConfiguration: "recover_seed",
} as const;

export type RecoverRestoreScreenProps = Readonly<{
  deviceType: string | null;
  deviceVersion: string | null;
  onClose: () => void;
  onContinue: () => void;
}>;

export type RecoverRestoreRow = Readonly<{
  id: "identity" | "phrase";
  number: string;
  description: string;
}>;

export type RecoverRestoreViewProps = Readonly<{
  title: string;
  description: string;
  rows: readonly RecoverRestoreRow[];
  continueLabel: string;
  closeLabel: string;
  onClose: () => void;
  onContinue: () => void;
  deviceType: string | null;
  deviceVersion: string | null;
}>;

function trackRestoreButton(
  button: string,
  deviceType: string | null,
  deviceVersion: string | null,
) {
  track("button_clicked", {
    button,
    page: restoreWithRecoverPage,
    ...restoreEventProps,
    ...(deviceType === null ? {} : { deviceType }),
    ...(deviceVersion === null ? {} : { deviceVersion }),
  });
}

export function useRecoverRestoreViewModel({
  deviceType,
  deviceVersion,
  onClose,
  onContinue,
}: RecoverRestoreScreenProps): RecoverRestoreViewProps {
  const { t } = useTranslation();

  return {
    title: t("deviceOnboarding.recover.restore.title"),
    description: t("deviceOnboarding.recover.restore.description"),
    rows: [
      {
        id: "identity",
        number: "1",
        description: t("deviceOnboarding.recover.restore.identity"),
      },
      {
        id: "phrase",
        number: "2",
        description: t("deviceOnboarding.recover.restore.phrase"),
      },
    ],
    continueLabel: t("deviceOnboarding.recover.restore.cta"),
    closeLabel: t("deviceOnboarding.checks.close"),
    deviceType,
    deviceVersion,
    onClose: () => {
      trackRestoreButton(closeButton, deviceType, deviceVersion);
      onClose();
    },
    onContinue: () => {
      trackRestoreButton(continueToRecoverButton, deviceType, deviceVersion);
      onContinue();
    },
  };
}

export { restoreEventProps };
