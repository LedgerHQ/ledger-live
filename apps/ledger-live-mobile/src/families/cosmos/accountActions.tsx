import React from "react";
import { canDelegate } from "@ledgerhq/live-common/families/cosmos/logic";

import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { CosmosAccount } from "@ledgerhq/live-common/lib/families/cosmos/types";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({ account }: { account: CosmosAccount }) => {
  const delegationDisabled = !canDelegate(account);

  return [
    {
      disabled: delegationDisabled,
      navigationParams: [
        NavigatorName.CosmosDelegationFlow,
        {
          screen:
            account.cosmosResources &&
            account.cosmosResources?.delegations.length > 0
              ? ScreenName.CosmosDelegationValidator
              : ScreenName.CosmosDelegationStarted,
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
