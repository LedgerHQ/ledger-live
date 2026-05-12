import React from "react";
import { Trans } from "~/context/Locale";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import type { ResolvedAccountBridge, TokenAccount } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
const getMainActions = ({
  account,
  parentAccount,
  bridge,
}: {
  account: TronAccount | TokenAccount;
  parentAccount: TronAccount | null | undefined;
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
      label: <Trans i18nKey={label} />,
      Icon: IconsLegacy.CoinsMedium,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "TRX",
        page: "Account Page",
        isRedirectConfig: false,
      },
    },
  ];
};

export default {
  getMainActions,
};
