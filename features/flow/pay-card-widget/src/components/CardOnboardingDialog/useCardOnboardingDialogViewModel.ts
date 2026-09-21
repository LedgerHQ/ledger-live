import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { CardOnboardingStepWithCopy } from "../CardOnboardingWidget/useOnboardingSteps";
import { getStepIconId } from "./getStepIconId";
import type {
  CardOnboardingOptionViewProps,
  StepStatus,
} from "../CardOnboardingOption/useCardOnboardingOptionViewModel";

const noop = () => {};

function toStepStatus(isDone: boolean, isFirstUndone: boolean): StepStatus {
  if (isDone) return "done";
  if (isFirstUndone) return "active";
  return "pending";
}

const STEP_ACTIONS: Record<string, () => void> = {
  "create-account": noop,
  "choose-card-type": noop,
  "top-up-card": noop,
  "apple-google-pay": noop,
  "first-purchase": noop,
};

type Params = {
  isOpen: boolean;
  steps: CardOnboardingStepWithCopy[];
  completedCount: number;
  totalCount: number;
  onClose: () => void;
  onboardingCompleted: boolean;
  handleGotIt: () => void;
};

export type CardOnboardingDialogViewProps = {
  readonly isOpen: boolean;
  readonly dialogTitle: string;
  readonly gotItLabel: string;
  readonly options: CardOnboardingOptionViewProps[];
  readonly completedCount: number;
  readonly totalCount: number;
  readonly handleClose: () => void;
  readonly onboardingCompleted: boolean;
  readonly handleGotIt: () => void;
};

export function useCardOnboardingDialogViewModel({
  isOpen,
  steps,
  completedCount,
  totalCount,
  onClose,
  onboardingCompleted,
  handleGotIt,
}: Params): CardOnboardingDialogViewProps {
  const { t } = useTranslation();
  const dialogTitle = t("payTab.cardOnboarding.dialog.title");
  const gotItLabel = t("payTab.cardOnboarding.dialog.gotIt");

  const options = useMemo<CardOnboardingOptionViewProps[]>(() => {
    const firstUndoneIndex = steps.findIndex(s => !s.isDone);
    return steps.map((step, index) => {
      const status = toStepStatus(step.isDone, index === firstUndoneIndex);
      return {
        id: step.id,
        title: step.title,
        description: step.isDone
          ? t("payTab.cardOnboarding.dialog.stepComplete")
          : step.description,
        status,
        iconId: getStepIconId(step.id),
        onAction: STEP_ACTIONS[step.id] ?? noop,
      };
    });
  }, [steps, t]);

  return {
    isOpen,
    dialogTitle,
    gotItLabel,
    options,
    completedCount,
    totalCount,
    handleClose: onClose,
    onboardingCompleted,
    handleGotIt,
  };
}
