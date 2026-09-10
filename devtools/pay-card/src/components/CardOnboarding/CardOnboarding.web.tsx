import type { PayCardOnboardingStatusProps } from "../../types";

export interface CardOnboardingScreenProps extends PayCardOnboardingStatusProps {
  readonly onBack: () => void;
}

/** Native-only for now, like the screens it sits next to. */
export function CardOnboardingScreen(_props: CardOnboardingScreenProps) {
  return null;
}
