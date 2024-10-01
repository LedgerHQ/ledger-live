import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type EarnRewardsPropsType = StackNavigatorProps<
  MultiversxDelegationFlowParamList,
  ScreenName.MultiversxDelegationStarted
>;
