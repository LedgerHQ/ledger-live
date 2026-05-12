import React from "react";
import { Trans } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { ResolvedAccountBridge, TokenAccount } from "@ledgerhq/types-live";
import { BitcoinAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const getMainActions = ({
  account,
  parentAccount,
  bridge,
}: {
  account: BitcoinAccount | TokenAccount;
  parentAccount: BitcoinAccount | null | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridge: ResolvedAccountBridge<any>;
}): ActionButtonEvent[] => {
  const mainAccount = getMainAccount(account, parentAccount);
  const label = getStakeLabelLocaleBased();

  const navigationParams: NavigationParamsType = bridge.isAccountEmpty(mainAccount)
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
      label: <Trans i18nKey={label} />,
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
