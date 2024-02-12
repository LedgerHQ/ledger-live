import React from "react";
import { useTranslation } from "react-i18next";
import ModalQuizz from "~/renderer/components/ModalQuizz/ModalQuizz";
import { getQuizzSteps } from "./quizzSteps";
import StartScreen from "./StartScreen";
import noop from "lodash/noop";

type PopinProps = {
  isOpen: boolean;
  onClose?: () => void;
  onLose: () => void;
  onWin: () => void;
};

export const QuizzPopin = ({ onWin, isOpen, onLose, onClose = noop }: PopinProps) => {
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <ModalQuizz
      title={t("onboarding.quizz.heading")}
      onClose={onClose}
      onWin={onWin}
      onLose={onLose}
      steps={getQuizzSteps(t)}
      StartScreen={StartScreen}
    />
  );
};
