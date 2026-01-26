import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { TransactionStatus } from "../../../generated/types";

export type RecentAddress = Readonly<{
  address: string;
  currency: CryptoOrTokenCurrency;
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

export type BridgeRecipientValidationResult = Readonly<{
  errors: BridgeValidationErrors;
  warnings: BridgeValidationWarnings;
  isLoading: boolean;
  status: TransactionStatus | null;
  cleanup: () => void;
}>;

export type RecipientSearchStateResult = Readonly<{
  showSearchResults: boolean;
  showMatchedAddress: boolean;
  showAddressValidationError: boolean;
  showEmptyState: boolean;
  showBridgeSenderError: boolean;
  showSanctionedBanner: boolean;
  showBridgeRecipientError: boolean;
  showBridgeRecipientWarning: boolean;
  isSanctioned: boolean;
  isAddressComplete: boolean;
  addressValidationErrorType: AddressValidationError;
  bridgeRecipientError: Error | undefined;
  bridgeRecipientWarning: Error | undefined;
  bridgeSenderError: Error | undefined;
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
