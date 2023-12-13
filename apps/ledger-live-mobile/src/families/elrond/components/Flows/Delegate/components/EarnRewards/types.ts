import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type EarnRewardsPropsType = StackNavigatorProps<
  ElrondDelegationFlowParamList,
  ScreenName.ElrondDelegationStarted
>;
