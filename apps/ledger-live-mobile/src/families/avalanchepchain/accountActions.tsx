import React from "react";
import { Account } from "@ledgerhq/types-live";
import { canDelegate } from "@ledgerhq/live-common/families/avalanchepchain/utils";

import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { AvalanchePChainAccount } from "@ledgerhq/live-common/families/avalanchepchain/types";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({ account }: { account: Account }) => {
  const isDelegationDisabled = !canDelegate(account);

  return [
    {
      disabled: isDelegationDisabled,
      navigationParams: [
        NavigatorName.AvalancheDelegationFlow,
        {
          screen:
            (account as AvalanchePChainAccount).avalanchePChainResources &&
            (account as AvalanchePChainAccount).avalanchePChainResources
              ?.delegations.length > 0
              ? ScreenName.AvalancheDelegationValidator
              : ScreenName.AvalancheDelegationStarted,
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
