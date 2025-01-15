import { Account, TokenAccount } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type AccountsListNavigator = {
  [ScreenName.AccountsList]: {
    sourceScreenName: ScreenName;
    showHeader?: boolean | string;
    canAddAccount?: boolean | string;
    isSyncEnabled?: boolean | string;
    specificAccounts?: Account[] | TokenAccount[];
  };
};
