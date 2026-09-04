import type { CardOnboardingDialogViewProps } from "../components/CardOnboardingDialog/useCardOnboardingDialogViewModel";
import type { CardOnboardingOptionViewProps } from "../components/CardOnboardingDialog/CardOnboardingOption/useCardOnboardingOptionViewModel";

export const cardOnboardingOption: CardOnboardingOptionViewProps = {
  id: "create-account",
  title: "Create account",
  description: "Open your card account",
  status: "active",
  iconId: "create-account",
  onAction: () => undefined,
};

export const cardOnboardingDialogProps: CardOnboardingDialogViewProps = {
  isOpen: true,
  dialogTitle: "Complete your card",
  options: [cardOnboardingOption],
  completedCount: 0,
  totalCount: 1,
  handleClose: () => undefined,
  onboardingCompleted: false,
  handleGotIt: () => undefined,
};
