import React from "react";
import { canDelegate } from "@ledgerhq/live-common/families/osmosis/logic";

import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "../../const";
import { ActionButtonEvent } from "../../components/FabActions";

const getActions = ({
  account,
}: {
  account: Account;
}): ActionButtonEvent[] | null | undefined => {
  const delegationDisabled = !canDelegate(account);

  return [
    {
      id: "stake",
      disabled: delegationDisabled,
      navigationParams: [
        NavigatorName.OsmosisDelegationFlow,
        {
          screen:
            account.cosmosResources &&
            account.cosmosResources?.delegations.length > 0
              ? ScreenName.OsmosisDelegationValidator
              : ScreenName.OsmosisDelegationStarted,
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
