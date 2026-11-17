import React from "react";
import { useTranslation } from "~/context/Locale";
import { QuitConfirmationView } from "./QuitConfirmationView";

export type QuitConfirmationProps = Readonly<{
  isOpen: boolean;
  stepName: string;
  onContinue: () => void;
  onLeave: () => void;
}>;

export function QuitConfirmation({ isOpen, stepName, onContinue, onLeave }: QuitConfirmationProps) {
  const { t } = useTranslation();

  return (
    <QuitConfirmationView
      isOpen={isOpen}
      title={t("deviceOnboarding.quitConfirmation.title")}
      description={t("deviceOnboarding.quitConfirmation.description")}
      restart={t("deviceOnboarding.quitConfirmation.restart", { step: stepName })}
      leaveLabel={t("deviceOnboarding.quitConfirmation.leave")}
      continueLabel={t("deviceOnboarding.quitConfirmation.continue")}
      onLeave={onLeave}
      onContinue={onContinue}
    />
  );
}
