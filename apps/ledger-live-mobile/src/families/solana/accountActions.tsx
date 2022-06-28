import React from "react";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({ account, parentAccount }: { account: Account,  parentAccount: Account }) => {
  const delegationDisabled = account.solanaResources?.stakes.length > 1;


  return [
    {
      disabled: delegationDisabled,
      navigationParams: [
        NavigatorName.SolanaDelegationFlow,
        {
          screen: ScreenName.DelegationStarted,
          params: {
            accountId: account.id,
            parentId: parentAccount ? parentAccount.id : undefined,
            delegationAction: {
              kind: "new"
            }
          },
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
