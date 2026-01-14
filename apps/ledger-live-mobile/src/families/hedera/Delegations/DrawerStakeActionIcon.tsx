import React from "react";
import { useTheme } from "@react-navigation/native";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import ClaimRewardIcon from "~/icons/ClaimReward";
import DelegateIcon from "~/icons/Delegate";
import UndelegateIcon from "~/icons/Undelegate";

interface Props {
  enabled: boolean;
  action: HEDERA_TRANSACTION_MODES;
}

export default function DrawerStakeActionIcon({ enabled, action }: Readonly<Props>) {
  const { colors } = useTheme();
  const iconColor = enabled ? undefined : colors.grey;

  switch (action) {
    case HEDERA_TRANSACTION_MODES.Delegate:
    case HEDERA_TRANSACTION_MODES.Redelegate:
      return <DelegateIcon color={iconColor} />;
    case HEDERA_TRANSACTION_MODES.Undelegate:
      return <UndelegateIcon color={iconColor} />;
    case HEDERA_TRANSACTION_MODES.ClaimRewards:
      return <ClaimRewardIcon color={iconColor} />;
    default:
      throw new Error("unreachable assertion failed");
  }
}
