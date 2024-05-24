import React from "react";
import { Trans } from "react-i18next";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { TRX } from "@ledgerhq/native-ui/assets/cryptoIcons";
import { TokenAccount } from "@ledgerhq/types-live";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: TronAccount | TokenAccount;
  parentAccount: TronAccount;
}): ActionButtonEvent[] => {
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
