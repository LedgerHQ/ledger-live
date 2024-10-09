import React from "react";
import { Trans } from "react-i18next";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getMainAccount, isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { TokenAccount } from "@ledgerhq/types-live";
import { BitcoinAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { IconsLegacy } from "@ledgerhq/native-ui";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: BitcoinAccount | TokenAccount;
  parentAccount: BitcoinAccount | null | undefined;
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
            platform: "acre",
            name: "Acre",
            accountId: mainAccount.id,
          },
        },
      ];

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.yield" />,
      Icon: IconsLegacy.CoinsMedium,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "BTC",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
