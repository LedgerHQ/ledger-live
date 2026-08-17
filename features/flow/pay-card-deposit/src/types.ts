export type DepositOptionId = "bankTransfer" | "swap" | "receive" | "buy";

export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type DepositOptionContent = Readonly<{
  title: string;
  description: string;
}>;

/**
 * User-facing copy injected by the host app. This package stays i18n-agnostic: the app
 * resolves translations and passes the strings in.
 */
export type DepositOptionsLabels = Readonly<{
  title: string;
  options: Readonly<Record<DepositOptionId, DepositOptionContent>>;
}>;

export type DepositOptionsProps = Readonly<{
  isOpen: boolean;
  labels: DepositOptionsLabels;
  page: string;
  onClose: () => void;
  /** Host-owned navigation intent for the pressed option. Navigation stays in the app. */
  onSelect: (id: DepositOptionId) => void;
  onTrackEvent?: PayCardTrackEvent;
}>;

export type DepositOption = DepositOptionContent & Readonly<{ id: DepositOptionId }>;

export type DepositOptionsViewModel = Readonly<{
  options: readonly DepositOption[];
  onSelectOption: (id: DepositOptionId) => void;
}>;

export type DepositOptionsViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  options: readonly DepositOption[];
  onClose: () => void;
  onSelectOption: (id: DepositOptionId) => void;
}>;
