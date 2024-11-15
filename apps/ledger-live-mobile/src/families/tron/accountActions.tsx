import React from "react";
import { Trans } from "react-i18next";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getMainAccount, isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { TokenAccount } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: TronAccount | TokenAccount;
  parentAccount: TronAccount | null | undefined;
}): ActionButtonEvent[] => {
  const mainAccount = getMainAccount(account, parentAccount);
  const navigationParams: NavigationParamsType = isAccountEmpty(mainAccount)
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
            accountId: mainAccount.id,
            yieldId: "tron-trx-native-staking",
          },
        },
      ];

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.stake" />,
      Icon: IconsLegacy.CoinsMedium,
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
