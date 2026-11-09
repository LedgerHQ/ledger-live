import type { FeePaymentOption } from "@features/platform-send-flow/sponsored";

export type FeePaymentSheetViewModel = Readonly<{
  title: string;
  disclaimer: string;
  learnMoreLabel: string;
  onLearnMore: () => void;
  options: readonly FeePaymentOption[];
  confirmLabel: string;
  confirmDisabled: boolean;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  /** Drops an unconfirmed pick when the sheet closes. */
  onClose: () => void;
}>;
