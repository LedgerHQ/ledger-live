export interface OnboardingWidgetViewProps {
  readonly title: string;
  readonly subtitle: string;
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly stepperLabel: string;
  readonly onPress: () => void;
}

export type UseOnboardingWidgetViewModelResult = OnboardingWidgetViewProps;
