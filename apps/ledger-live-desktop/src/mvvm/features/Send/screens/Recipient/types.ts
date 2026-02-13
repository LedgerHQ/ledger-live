import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export type RecentAddress = Readonly<{
  address: string;
  currency: CryptoCurrency | TokenCurrency;
  lastUsedAt: Date;
  name?: string;
  ensName?: string;
  isLedgerAccount?: boolean;
  accountId?: string;
}>;

export type AddressValidationStatus =
  | "idle"
  | "loading"
  | "valid"
  | "invalid"
  | "sanctioned"
  | "ens_resolved";

export type AddressValidationError =
  | "incorrect_format"
  | "sanctioned"
  | "incompatible_asset"
  | "wallet_not_exist"
  | null;

export type MatchedAccount = Readonly<{
  account: Account;
  accountName: string | undefined;
  accountBalance: string | undefined;
  accountBalanceFormatted: string | undefined;
}>;

export type BridgeValidationErrors = {
  recipient?: Error;
  sender?: Error;
  transaction?: Error;
};

export type BridgeValidationWarnings = Record<string, Error>;

export type AddressSearchResult = Readonly<{
  status: AddressValidationStatus;
  error: AddressValidationError;
  resolvedAddress: string | undefined;
  ensName: string | undefined;
  isLedgerAccount: boolean;
  accountName: string | undefined;
  accountBalance: string | undefined;
  accountBalanceFormatted: string | undefined;
  isFirstInteraction: boolean;
  matchedRecentAddress: RecentAddress | undefined;
  matchedAccounts: MatchedAccount[];
  bridgeErrors: BridgeValidationErrors | undefined;
  bridgeWarnings: BridgeValidationWarnings | undefined;
}>;

export type AddressListItemProps = Readonly<{
  address: string;
  name?: string;
  description?: string;
  date?: Date;
  balance?: string;
  balanceFormatted?: string;
  onSelect?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  showSendTo?: boolean;
  isLedgerAccount?: boolean;
  disabled?: boolean;
  hideDescription?: boolean;
}>;
