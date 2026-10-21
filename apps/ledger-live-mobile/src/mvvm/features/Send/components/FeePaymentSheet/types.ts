import type { FeePaymentOption } from "@ledgerhq/live-common/flows/send/sponsored/types";

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
