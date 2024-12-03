import { ScreenName } from "~/const";

export type AccountsListNavigator = {
  [ScreenName.AccountsList]: {
    sourceScreenName: ScreenName;
    showHeader?: boolean;
    canAddAccount?: boolean;
    isSyncEnabled?: boolean;
  };
};
