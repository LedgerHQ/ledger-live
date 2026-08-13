import type { PayCardBalanceFilter } from "@domain/entity-pay-card";
import type { FormattedValue } from "@ledgerhq/lumen-utils-shared";

// Shared by both platforms (`AmountDisplay`);
export type { FormattedValue };

export type PayCardBalanceStatus = "loading" | "error" | "ready";

export type PayCardBalanceEmptyLabels = Readonly<{
  emptyTitle: string;
  emptyDescription: string;
}>;

export type PayCardBalanceFilterLabels = Readonly<{
  allStablecoins: string;
  filterDialogTitle: string;
  filterDialogDescription: string;
  filterDialogBanner: string;
  confirm: string;
}>;

export type PayCardBalanceLabels = PayCardBalanceEmptyLabels & PayCardBalanceFilterLabels;

/** A selectable row in the filter dialog. `id` is `"all"` or a stablecoin currencyId. */
export type PayCardBalanceFilterOption = Readonly<{
  id: PayCardBalanceFilter;
  title: string;
  /** Absent for the "all" row. */
  ticker?: string;
  /** Ledger currency id for the crypto icon. Absent for the "all" row. */
  ledgerId?: string;
  countervalue: number;
  /** Preformatted fiat countervalue, e.g. "$1,000.00". */
  countervalueLabel: string;
  /** Preformatted crypto amount, e.g. "1,000.00 USDC". Absent for the "all" row. */
  cryptoAmountLabel?: string;
}>;

/** Host props for `PayCardBalance`, produced via {@link aggregatePayCardBalance}. */
export type PayCardBalanceData = Readonly<{
  status: PayCardBalanceStatus;
  stableBalance: number;
  filter: PayCardBalanceFilter;
  /** Whether the user holds any stablecoin balance. Drives funded vs empty. */
  hasBalance: boolean;
  /** First entry is always the "all" option. */
  filterOptions: readonly PayCardBalanceFilterOption[];
  formatCountervalue: (value: number) => FormattedValue;
  onConfirmFilter: (filter: PayCardBalanceFilter) => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export type PayCardStablecoin = Readonly<{
  currency: Readonly<{ id: string }>;
  value: number;
}>;

// Platform-agnostic input for {@link aggregatePayCardBalance}
export type PayCardPortfolioPort = Readonly<{
  stablecoins: readonly PayCardStablecoin[];
  filter: PayCardBalanceFilter;
  isLoading: boolean;
  isError: boolean;
  /** First entry is always the "all" option. */
  filterOptions: readonly PayCardBalanceFilterOption[];
  formatCountervalue: (value: number) => FormattedValue;
  onConfirmFilter: (filter: PayCardBalanceFilter) => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export type PayCardBalanceProps = PayCardBalanceData &
  Readonly<{
    labels: PayCardBalanceLabels;
  }>;

export type PayCardBalanceViewProps =
  | Readonly<{
      displayMode: "empty";
      labels: PayCardBalanceEmptyLabels;
    }>
  | Readonly<{
      displayMode: "funded";
      balance: number;
      formatCountervalue: (value: number) => FormattedValue;
      isLoading: boolean;
      labels: PayCardBalanceFilterLabels;
      filter: PayCardBalanceFilter;
      options: readonly PayCardBalanceFilterOption[];
      /** Applied option, or `undefined` when "all" is active. */
      selectedOption?: PayCardBalanceFilterOption;
      isFilterOpen: boolean;
      onOpenFilter: () => void;
      onCloseFilter: () => void;
      onConfirmFilter: (filter: PayCardBalanceFilter) => void;
      onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
    }>;

export type BalanceFilterDialogViewModelParams = Readonly<{
  isOpen: boolean;
  /** Active (resolved) filter, used to seed the draft when the dialog opens. */
  activeFilter: PayCardBalanceFilter;
  options: readonly PayCardBalanceFilterOption[];
  onConfirmFilter: (filter: PayCardBalanceFilter) => void;
  onClose: () => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export type BalanceFilterDialogViewModel = Readonly<{
  draftFilter: PayCardBalanceFilter;
  onSelectDraft: (filter: PayCardBalanceFilter) => void;
  onConfirm: () => void;
}>;
