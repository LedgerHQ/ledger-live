import React from "react";
import { useTheme } from "@react-navigation/native";
import type { StakingAction } from "@ledgerhq/live-common/families/hedera/types";
import ClaimRewardIcon from "~/icons/ClaimReward";
import DelegateIcon from "~/icons/Delegate";
import UndelegateIcon from "~/icons/Undelegate";

interface Props {
  enabled: boolean;
  action: StakingAction;
}

export default function DrawerStakeActionIcon({ enabled, action }: Props) {
  const { colors } = useTheme();
  const iconColor = enabled ? undefined : colors.grey;

  switch (action) {
    case "delegation":
    case "redelegation":
      return <DelegateIcon color={iconColor} />;
    case "undelegation":
      return <UndelegateIcon color={iconColor} />;
    case "claimRewards":
      return <ClaimRewardIcon color={iconColor} />;
    default:
      throw new Error("unreachable assertion failed");
  }
}
