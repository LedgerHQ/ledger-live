export type DepositOptionId = "bankTransfer" | "swap" | "receive" | "buy";

export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type DepositOptionContent = Readonly<{
  title: string;
  description: string;
}>;

export type DepositOptionsProps = Readonly<{
  isOpen: boolean;
  page: string;
  bottomInset?: number;
  onClose: () => void;
  /** Host-owned navigation intent for the pressed option. Navigation stays in the app. */
  onSelect: (id: DepositOptionId) => void;
  onTrackEvent?: PayCardTrackEvent;
}>;

export type DepositOption = DepositOptionContent & Readonly<{ id: DepositOptionId }>;

export type DepositOptionsViewModel = Readonly<{
  title: string;
  options: readonly DepositOption[];
  onSelectOption: (id: DepositOptionId) => void;
}>;

export type DepositOptionsViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  options: readonly DepositOption[];
  bottomInset?: number;
  onClose: () => void;
  onSelectOption: (id: DepositOptionId) => void;
}>;
