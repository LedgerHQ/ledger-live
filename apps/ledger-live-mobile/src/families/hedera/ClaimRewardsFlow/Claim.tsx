import React from "react";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { HederaClaimRewardsFlowParamList } from "./types";

type Props = StackNavigatorProps<
  HederaClaimRewardsFlowParamList,
  ScreenName.HederaClaimRewardsClaim
>;

function ClaimRewardsClaim({ navigation, route }: Props) {
  return null;
}

export default ClaimRewardsClaim;
