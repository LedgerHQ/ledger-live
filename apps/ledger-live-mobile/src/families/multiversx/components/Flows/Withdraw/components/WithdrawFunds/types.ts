import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXWithdrawFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type WithdrawFundsPropsType = StackNavigatorProps<
  MultiversXWithdrawFlowParamList,
  ScreenName.MultiversXWithdrawFunds
>;
