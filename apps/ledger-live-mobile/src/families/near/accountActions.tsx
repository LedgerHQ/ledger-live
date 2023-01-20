import React from "react";
import { canStake } from "@ledgerhq/live-common/families/near/logic";

import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { NearAccount } from "@ledgerhq/live-common/families/near/types";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({ account }: { account: NearAccount }) => {
  const stakingDisabled = !canStake(account);

  return [
    {
      disabled: stakingDisabled,
      navigationParams: [
        NavigatorName.NearStakingFlow,
        {
          screen:
            account.nearResources &&
            account.nearResources?.stakingPositions.length > 0
              ? ScreenName.NearStakingValidator
              : ScreenName.NearStakingStarted,
        },
      ],
      label: <Trans i18nKey="account.stake" />,
      Icon: Icons.ClaimRewardsMedium,
    },
  ];
};

export default {
  getActions,
};
