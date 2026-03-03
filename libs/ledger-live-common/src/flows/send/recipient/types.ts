import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";

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
