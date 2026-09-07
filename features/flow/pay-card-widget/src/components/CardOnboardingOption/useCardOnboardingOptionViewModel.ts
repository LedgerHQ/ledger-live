export type StepStatus = "done" | "active" | "pending";

export type CardOnboardingOptionViewProps = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: StepStatus;
  readonly iconId: string;
  readonly onAction: () => void;
};

export function useCardOnboardingOptionViewModel({
  id,
  title,
  description,
  status,
  iconId,
  onAction,
}: CardOnboardingOptionViewProps): CardOnboardingOptionViewProps {
  return { id, title, description, status, iconId, onAction };
}
