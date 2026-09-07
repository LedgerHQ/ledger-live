import type { BalanceFilter } from "./state";
import type { FormattedValue } from "@ledgerhq/lumen-utils-shared";
import type { ActionTilesProps } from "./components/ActionTiles/types";

// Shared by both platforms (`AmountDisplay`);
export type { FormattedValue };

export type BalanceStatus = "loading" | "error" | "ready";

export type BalanceEmptyLabels = Readonly<{
  emptyTitle: string;
  emptyDescription: string;
}>;

export type BalanceFilterLabels = Readonly<{
  allStablecoins: string;
  filterDialogTitle: string;
  filterDialogDescription: string;
  filterDialogBanner: string;
  confirm: string;
}>;

export type BalanceLabels = BalanceEmptyLabels & BalanceFilterLabels;

/** A selectable row in the filter dialog. `id` is `"all"` or a stablecoin currencyId. */
export type BalanceFilterOption = Readonly<{
  id: BalanceFilter;
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

export type Stablecoin = Readonly<{
  currency: Readonly<{ id: string; ticker: string }>;
  value: number;
  balance: number;
}>;

/** Platform-agnostic input for {@link aggregateBalance}. */
export type PortfolioPort = Readonly<{
  stablecoins: readonly Stablecoin[];
  filter: BalanceFilter;
  isLoading: boolean;
  isError: boolean;
  /** First entry is always the "all" option. */
  filterOptions: readonly BalanceFilterOption[];
  formatCountervalue: (value: number) => FormattedValue;
  onConfirmFilter: (filter: BalanceFilter) => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

/** Result of {@link aggregateBalance}: filtered total, funded flag, and status. */
export type BalanceAggregate = Readonly<{
  status: BalanceStatus;
  stableBalance: number;
  /** Any positive crypto or countervalue holding. Drives funded vs empty. */
  hasBalance: boolean;
  filter: BalanceFilter;
  formatCountervalue: (value: number) => FormattedValue;
}>;

/** Full host props for `Balance` (= aggregate + filter UI wiring). */
export type BalanceData = BalanceAggregate &
  Readonly<{
    /** First entry is always the "all" option. */
    filterOptions: readonly BalanceFilterOption[];
    onConfirmFilter: (filter: BalanceFilter) => void;
    onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
  }>;

export type BalanceProps = BalanceData &
  Readonly<{
    actionTiles?: ActionTilesProps;
  }>;

export type BalanceViewProps =
  | Readonly<{
      displayMode: "empty";
      labels: BalanceEmptyLabels;
      actionTiles?: ActionTilesProps;
    }>
  | Readonly<{
      displayMode: "funded";
      balance: number;
      formatCountervalue: (value: number) => FormattedValue;
      isLoading: boolean;
      labels: BalanceFilterLabels;
      filter: BalanceFilter;
      options: readonly BalanceFilterOption[];
      /** Applied option, or `undefined` when "all" is active. */
      selectedOption?: BalanceFilterOption;
      isFilterOpen: boolean;
      onOpenFilter: () => void;
      onCloseFilter: () => void;
      onConfirmFilter: (filter: BalanceFilter) => void;
      onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
      actionTiles?: ActionTilesProps;
    }>;

export type BalanceFilterPickerViewModelParams = Readonly<{
  isOpen: boolean;
  /** Active (resolved) filter, used to seed the draft when the picker opens. */
  activeFilter: BalanceFilter;
  options: readonly BalanceFilterOption[];
  onConfirmFilter: (filter: BalanceFilter) => void;
  onClose: () => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export type BalanceFilterPickerViewModel = Readonly<{
  draftFilter: BalanceFilter;
  onSelectDraft: (filter: BalanceFilter) => void;
  onConfirm: () => void;
}>;

/** Presentation props shared by the web dialog and native bottom-sheet views. */
export type BalanceFilterPickerViewProps = Readonly<{
  isOpen: boolean;
  draftFilter: BalanceFilter;
  options: readonly BalanceFilterOption[];
  labels: BalanceFilterLabels;
  onClose: () => void;
  onSelectDraft: (filter: BalanceFilter) => void;
  onConfirm: () => void;
}>;
