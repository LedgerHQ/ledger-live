import React from "react";
import { Trans } from "~/context/Locale";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import type { Account, ResolvedAccountBridge } from "@ledgerhq/types-live";
import CeloIcon from "./components/CeloIcon";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const getMainActions = ({
  account,
  parentAccount,
  bridge,
}: {
  account: CeloAccount;
  parentAccount: Account;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridge: ResolvedAccountBridge<any>;
}): ActionButtonEvent[] => {
  const label = getStakeLabelLocaleBased();

  const navigationParams: NavigationParamsType = bridge.isAccountEmpty(account)
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
