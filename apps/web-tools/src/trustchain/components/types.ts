import { WalletState } from "@ledgerhq/live-wallet/store";
import { Account } from "@ledgerhq/types-live";
import { NonImportedAccountInfo } from "@ledgerhq/live-wallet/walletsync/modules/accounts";

export type State = {
  accounts: Account[];
  walletState: WalletState;
  nonImportedAccounts: NonImportedAccountInfo[];
};
