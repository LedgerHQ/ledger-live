import { Strategy } from "@ledgerhq/coin-evm/types/index";
import { Result } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account, AccountLike, TransactionStatusCommon } from "@ledgerhq/types-live";
import { CompositeScreenProps } from "@react-navigation/native";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../const";

export type StrategyWithCustom = Strategy | "custom";

export type SendRowsFeeProps<T extends Transaction = Transaction> = {
  transaction: T;
  account: AccountLike;
  parentAccount?: Account | null;
  setTransaction: Result<T>["setTransaction"];
  shouldPrefillEvmGasOptions?: boolean;
  transactionToUpdate?: T;
  status?: TransactionStatusCommon;
} & CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendSummary>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.SignTransactionSummary>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapSelectFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;
