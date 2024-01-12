import React from "react";
import { Trans } from "react-i18next";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import invariant from "invariant";
import type { Account } from "@ledgerhq/types-live";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import CeloIcon from "./components/CeloIcon";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: CeloAccount;
  parentAccount: Account;
}): ActionButtonEvent[] => {
  const { celoResources } = account;
  invariant(celoResources, "celo resources not parsed");

  const navigationParams: NavigationParamsType = isAccountEmpty(account)
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
        NavigatorName.CeloManageAssetsNavigator,
        {
          screen: ScreenName.CosmosDelegationStarted,
          params: {
            account,
          },
        },
      ];
  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.stake" />,
      Icon: () => <CeloIcon isDisabled={false} />,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "CELO",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
