import React from "react";
import { Trans } from "react-i18next";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import invariant from "invariant";
import type { Account } from "@ledgerhq/types-live";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import CeloIcon from "./components/CeloIcon";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: CeloAccount;
  parentAccount: Account;
}): ActionButtonEvent[] => {
  const { celoResources } = account;
  invariant(celoResources, "celo resources not parsed");
  const label = getStakeLabelLocaleBased();

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
      label: <Trans i18nKey={label} />,
      Icon: () => <CeloIcon isDisabled={false} />,
      eventProperties: {
        currency: "CELO",
      },
      testId: "account-quick-action-button-earn",
    },
  ];
};

export default {
  getMainActions,
};
