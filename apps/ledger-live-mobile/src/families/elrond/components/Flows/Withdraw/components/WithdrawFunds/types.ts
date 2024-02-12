import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondWithdrawFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type WithdrawFundsPropsType = StackNavigatorProps<
  ElrondWithdrawFlowParamList,
  ScreenName.ElrondWithdrawFunds
>;
