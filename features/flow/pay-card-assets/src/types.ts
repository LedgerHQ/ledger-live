import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type {
  CardTransactionFormatters,
  CardTransactionItem,
} from "@features/flow-pay-card-transactions";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";

export type CardAssetRow = Readonly<{
  id: string;
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
  /** Prices one wallet. The rates are the app's, so the host owns this. */
  priceWallet: (currency: CryptoOrTokenCurrency, balance: string) => number | null;
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
  onAddAsset?: () => void;
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
  dialogState: CardAssetDialogState;
  selectedAsset: CardAssetRow | null;
  selectedAssetTransactions: readonly CardTransactionItem[];
  formatBalance?: (value: number) => FormattedValue;
  formatters?: CardTransactionFormatters;
  dialogCopy: CardAssetDialogCopy;
  onAssetPress: (asset: CardAssetRow) => void;
  onDialogClose: () => void;
  onTopUpPress: () => void;
  onWithdrawPress: () => void;
  /** Withdraw is nested in details: dismissing it returns to details, it does not close both. */
  onWithdrawClose: () => void;
  onShowHistoryPress: () => void;
  onWithdrawContinue: () => void;
  onManagePress: () => void;
  onAddAssetPress: () => void;
}>;
