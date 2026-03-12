export interface OnboardingWidgetViewProps {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly stepperLabel: string;
  readonly onPress: () => void;
}

export type UseOnboardingWidgetViewModelResult = OnboardingWidgetViewProps;
