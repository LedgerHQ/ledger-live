import { Account } from "@ledgerhq/types-live";
import { NonImportedAccountInfo } from "@ledgerhq/live-wallet/accounts";
import { type WSState } from "@domain/entity-wallet-sync";
import { type AccountNamesState } from "@domain/entity-account-name";
import { type RecentAddressesState } from "@domain/entity-recent-addresses";

export type WalletState = {
  accountNames: AccountNamesState;
  walletSyncState: WSState;
  recentAddresses: RecentAddressesState;
};

export type State = {
  accounts: Account[];
  walletState: WalletState;
  nonImportedAccounts: NonImportedAccountInfo[];
};
