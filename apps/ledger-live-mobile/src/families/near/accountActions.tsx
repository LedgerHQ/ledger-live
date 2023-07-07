import React from "react";
import { canStake } from "@ledgerhq/live-common/families/near/logic";
import { NearAccount } from "@ledgerhq/live-common/families/near/types";

import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "../../const";
import { ParamListBase, RouteProp } from "@react-navigation/native";

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: NearAccount;
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}) => {
  const stakingDisabled = !canStake(account);
  const navigationParams = stakingDisabled
    ? [
        NavigatorName.NoFundsFlow,
        {
          screen: ScreenName.NoFunds,
          params: {
            account,
            parentAccount,
          },
        },
      ]
    : [
        NavigatorName.NearStakingFlow,
        {
          screen:
            account.nearResources && account.nearResources?.stakingPositions.length > 0
              ? ScreenName.NearStakingValidator
              : ScreenName.NearStakingStarted,
          params: {
            source: parentRoute,
          },
        },
      ];
  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.stake" />,
      Icon: Icons.ClaimRewardsMedium,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "NEAR",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
