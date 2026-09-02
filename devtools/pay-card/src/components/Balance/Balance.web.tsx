import type { PayCardBalanceProps } from "../../types";

export interface BalanceScreenProps extends PayCardBalanceProps {
  readonly onBack: () => void;
}

/** Native-only for now, like the interaction screen it sits next to. */
export function BalanceScreen(_props: BalanceScreenProps) {
  return null;
}
