export interface OnboardingWidgetViewProps {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly stepperLabel: string;
  readonly onPress: () => void;
  readonly loading: boolean;
}

export type UseOnboardingWidgetViewModelResult = OnboardingWidgetViewProps;
