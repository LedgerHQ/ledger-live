import { Account, AccountLike } from "@ledgerhq/types-live";
import { CompositeScreenProps } from "@react-navigation/native";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Result } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../const";

export type SendRowsFeeProps<T extends Transaction = Transaction> = {
  transaction: T;
  account: AccountLike;
  parentAccount?: Account | null;
  setTransaction: Result<T>["setTransaction"];
} & CompositeScreenProps<
  | StackNavigatorProps<
      SendFundsNavigatorStackParamList,
      ScreenName.SendSummary
    >
  | StackNavigatorProps<
      SignTransactionNavigatorParamList,
      ScreenName.SignTransactionSummary
    >
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;
