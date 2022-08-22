import React from "react";
import { canDelegate } from "@ledgerhq/live-common/families/cosmos/logic";

import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { NavigatorName, ScreenName } from "../../const";
import { CeloAccount } from "@ledgerhq/live-common/lib/families/celo/types";
import invariant from "invariant";

const getActions = ({ account }: { account: CeloAccount }) => {
  invariant(account, "celo account not found");
  const { celoResources } = account;
  invariant(celoResources, "celo resources not parsed");

  return [
    {
      disabled: false,
      navigationParams: [
        NavigatorName.CeloManageAssetsNavigator,
        {
          screen: ScreenName.CosmosDelegationStarted,
          params: {
            account: account,
          },
        },
      ],
      label: <Trans i18nKey="celo.manage.title" />,
      Icon: Icons.ClaimRewardsMedium,
    },
  ];
};

export default {
  getActions,
};
