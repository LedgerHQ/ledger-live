import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  RecentAddress,
  AddressSearchResult,
  AddressValidationError,
  RecipientSearchStateResult,
} from "@ledgerhq/live-common/flows/send/recipient/types";

export type {
  RecentAddress,
  AddressSearchResult,
  AddressValidationError,
  RecipientSearchStateResult,
};

export type RecipientScreenViewProps = Readonly<{
  searchValue: string;
  isLoading: boolean;
  result: AddressSearchResult;
  recentAddresses: RecentAddress[];
  mainAccount: Account;
  currency: CryptoOrTokenCurrency;
  clipboardAddress: string | null;
  showInitialState: boolean;
  showInitialEmptyState: boolean;
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
  onPasteFromClipboard: () => void;
  onRecentAddressSelect: (address: RecentAddress) => void;
  onAccountSelect: (account: Account) => void;
  onAddressSelect: (address: string, ensName?: string) => void;
  onRemoveAddress: (address: RecentAddress) => void;
}>;

export type RecentAddressTileProps = Readonly<{
  recentAddress: RecentAddress;
  onSelect: () => void;
  onRemove: () => void;
}>;

export type AccountListItemProps = Readonly<{
  account: Account;
  onSelect: () => void;
}>;
