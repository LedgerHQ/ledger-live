export type CardTopUpRatio = Readonly<{
  id: string;
  label: string;
  disabled: boolean;
  onSelect: () => void;
}>;

export type CardTopUpAmountViewProps = Readonly<{
  title: string;
  headerDescription: string;
  amountText: string;
  currencyText: string;
  currencyPosition: "left" | "right";
  maxDecimalLength: number;
  secondaryValue: string | null;
  canToggleInputMode: boolean;
  amountError: string | null;
  ratios: readonly CardTopUpRatio[];
  canSubmit: boolean;
  onAmountChange: (text: string) => void;
  onToggleInputMode: () => void;
  onSubmit: () => void;
  onOpenLegal: () => void;
  /** Web only: mobile closes the screen from its navigation header. */
  onClose?: () => void;
}>;
