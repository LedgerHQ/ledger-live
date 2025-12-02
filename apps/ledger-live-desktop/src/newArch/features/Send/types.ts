import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export type RecentAddress = {
  address: string;
  name?: string;
  lastUsedAt: Date;
  currency: CryptoCurrency | TokenCurrency;
  isENS?: boolean;
  ensName?: string;
};

export type AddressValidationStatus =
  | "idle"
  | "loading"
  | "valid"
  | "invalid"
  | "sanctioned"
  | "ens_resolved"
  | "not_found";

export type AddressValidationError =
  | "incorrect_format"
  | "incompatible_asset"
  | "wallet_not_exist"
  | "sanctioned"
  | null;

export type MatchedAccount = {
  account: Account;
  accountName?: string;
  accountBalance?: string;
  accountBalanceFormatted?: string;
};

export type BridgeValidationErrors = {
  recipient?: Error;
  sender?: Error;
};

export type BridgeValidationWarnings = {
  recipient?: Error;
  [key: string]: Error | undefined;
};

export type AddressSearchResult = {
  status: AddressValidationStatus;
  error: AddressValidationError;
  resolvedAddress?: string;
  ensName?: string;
  isLedgerAccount?: boolean;
  accountName?: string;
  accountBalance?: string;
  accountBalanceFormatted?: string;
  isFirstInteraction?: boolean;
  matchedRecentAddress?: RecentAddress;
  matchedAccounts?: MatchedAccount[];
  bridgeErrors?: BridgeValidationErrors;
  bridgeWarnings?: BridgeValidationWarnings;
};

export type SelectedRecipient = {
  address: string;
  ensName?: string;
} | null;

export type RecipientAddressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  account: AccountLike;
  parentAccount?: Account;
  currency: CryptoCurrency | TokenCurrency;
  availableBalance: string;
  onAddressSelected: (address: string, ensName?: string) => void;
  selectedRecipient?: SelectedRecipient;
  onConfirmRecipient?: () => void;
};

export type AddressListItemProps = {
  address: string;
  name?: string;
  description?: string;
  date?: Date;
  balance?: string;
  balanceFormatted?: string;
  onSelect: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  showSendTo?: boolean;
  isLedgerAccount?: boolean;
  disabled?: boolean;
};
