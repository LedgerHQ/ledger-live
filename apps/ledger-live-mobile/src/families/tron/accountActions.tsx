import React from "react";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import invariant from "invariant";
import { TRX } from "../../../../../libs/ui/packages/crypto-icons/native";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: TronAccount;
  parentAccount: Account;
}): ActionButtonEvent[] => {
  const { tronResources } = account;
  invariant(tronResources, "tron resources not parsed");

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
        ScreenName.PlatformApp,
        {
          params: {
            platform: "stakekit",
            name: "StakeKit",
            accountId: account.id,
            yieldId: "tron-trx-native-staking",
          },
        },
      ];
  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.stake" />,
      Icon: () => <TRX />,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "TRX",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
