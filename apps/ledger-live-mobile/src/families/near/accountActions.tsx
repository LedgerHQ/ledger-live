import React from "react";
import { canStake } from "@ledgerhq/live-common/families/near/logic";

import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { NearAccount } from "@ledgerhq/live-common/families/near/types";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "../../const";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: NearAccount;
  parentAccount: Account;
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
            account.nearResources &&
            account.nearResources?.stakingPositions.length > 0
              ? ScreenName.NearStakingValidator
              : ScreenName.NearStakingStarted,
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
        token: "NEAR",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
