import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type EarnRewardsPropsType = StackNavigatorProps<
  MultiversXDelegationFlowParamList,
  ScreenName.MultiversXDelegationStarted
>;
