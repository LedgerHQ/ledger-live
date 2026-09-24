import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type {
  CardTransactionFormatters,
  CardTransactionItem,
} from "@features/flow-pay-card-transactions";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";

export type CardAssetRow = Readonly<{
  id: string;
  /** Provider address identifier used to mutate the linked wallet. */
  addressId?: string;
  /** Provider asset code used by card transaction funding sources. */
  currency: string;
  /** Provider network paired with `currency` by the existing asset catalog. */
  network: string;
  /** The currency's own name, e.g. "USD Coin". The provider's asset code when nothing maps it. */
  name: string;
  ticker: string;
  /** What `CryptoIcon` needs to find the glyph. Empty for a wallet no Ledger currency maps. */
  ledgerId: string;
  cryptoAmount: string;
  /** In the counter-value currency. `null` when nothing could price the wallet. */
  countervalue: string | null;
  /** Raw counter-value used by AmountDisplay. */
  countervalueAmount: number | null;
}>;

export type CardAssetsStatus = "loading" | "error" | "empty" | "ready";

export type CardAssetsProps = Readonly<{
  currencies: ReadonlyMap<string, CryptoOrTokenCurrency>;
  /**
   * An amount of the given currency, in the counter-value currency's smallest unit, or `null`
   * when no rate covers it. The rates are the app's, so the host owns this.
   */
  getCounterValue: (currency: CryptoOrTokenCurrency, balance: string) => number | null;
  formatCountervalue: (value: number) => string;
  /**
   * Same formatter the card face AmountDisplay uses (`formatCurrencyUnitFragment`).
   * The list keeps the string form above; the details dialog needs fragments.
   */
  formatBalance?: (value: number) => FormattedValue;
  /** The host's amount and date formatters, the same ones the transactions listing is given. */
  formatters?: CardTransactionFormatters;
  onTopUp?: (asset: CardAssetRow) => void;
  onWithdraw?: (asset: CardAssetRow) => void;
  onShowHistory?: (asset: CardAssetRow) => void;
  onAddAsset: () => void;
}>;

export type CardAssetDialogState = "closed" | "details" | "withdraw" | "manage";

export type CardAssetDialogCopy = Readonly<{
  topUp: string;
  withdraw: string;
  transactions: string;
  withdrawTitle: string;
  withdrawDescription: string;
  continue: string;
}>;

export type CardAssetsViewModel = Readonly<{
  isVisible: boolean;
  status: CardAssetsStatus;
  rows: readonly CardAssetRow[];
  getRecentTransactions: (asset: CardAssetRow) => readonly CardTransactionItem[];
  formatBalance?: (value: number) => FormattedValue;
  formatters?: CardTransactionFormatters;
  dialogCopy: CardAssetDialogCopy;
  onTopUp?: (asset: CardAssetRow) => void;
  onWithdraw?: (asset: CardAssetRow) => void;
  onShowHistory?: (asset: CardAssetRow) => void;
  /** Manage opening and closing, so a changed debit order is tracked once it is left. */
  onManageOpen: () => void;
  onManageClose: () => void;
  onAddAssetPress?: () => void;
  onMoveAsset: (id: string, toIndex: number) => Promise<void>;
  /** Wallets with an in-flight priority update. Multiple moves can be in flight at once — each
   * drop is issued independently rather than waiting for the previous one to settle. */
  reorderingAssetIds: ReadonlySet<string>;
}>;

/** The list with its entry points: the host decides what pressing an asset or manage opens. */
export type CardAssetsListProps = CardAssetsViewModel &
  Readonly<{
    onAssetPress: (asset: CardAssetRow) => void;
    onManagePress: () => void;
  }>;
