import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxWithdrawFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type WithdrawFundsPropsType = StackNavigatorProps<
  MultiversxWithdrawFlowParamList,
  ScreenName.MultiversxWithdrawFunds
>;
