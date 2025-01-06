import { Account, TokenAccount } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type AccountsListNavigator = {
  [ScreenName.AccountsList]: {
    sourceScreenName: ScreenName;
    showHeader?: boolean;
    canAddAccount?: boolean;
    isSyncEnabled?: boolean;
    specificAccounts?: Account[] | TokenAccount[];
  };
};
