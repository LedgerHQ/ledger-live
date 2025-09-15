import { Account, AccountLike } from "@ledgerhq/types-live";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";

export type Props = StackNavigatorProps<
  BaseNavigatorStackParamList,
  ScreenName.PortfolioOperationHistory
>;

export type PortfolioHistoryProps = {
  accounts: Account[];
  allAccounts: AccountLike[];
  onEndReached?: () => void;
  onTransactionButtonPress?: () => void;
  opCount?: number;
  skipOp?: number;
};
