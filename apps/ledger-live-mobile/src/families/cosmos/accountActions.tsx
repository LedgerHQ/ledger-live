import React from "react";
import { canDelegate } from "@ledgerhq/live-common/families/cosmos/logic";
import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "../../const";
import { ActionButtonEvent } from "../../components/FabActions";

type NavigationParamsType = readonly [name: string, options: object];

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: CosmosAccount;
  parentAccount?: Account;
}): ActionButtonEvent[] | null | undefined => {
  const delegationDisabled = !canDelegate(account);
  const navigationParams = delegationDisabled
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
        NavigatorName.CosmosDelegationFlow,
        {
          screen:
            account.cosmosResources &&
            account.cosmosResources?.delegations.length > 0
              ? ScreenName.CosmosDelegationValidator
              : ScreenName.CosmosDelegationStarted,
        },
      ];
  return [
    {
      id: "stake",
      navigationParams: navigationParams as unknown as NavigationParamsType,
      label: <Trans i18nKey="account.stake" />,
      Icon: Icons.ClaimRewardsMedium,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        token: "COSMOS",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
