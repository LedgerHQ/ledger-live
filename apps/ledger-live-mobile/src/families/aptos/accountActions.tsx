import React from "react";
// import { getMaxSendBalance } from "@ledgerhq/live-common/families/aptos/logic";
// import { MIN_COINS_ON_SHARES_POOL_IN_OCTAS } from "@ledgerhq/live-common/families/aptos/constants";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: AptosAccount;
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] => {
  const stakingDisabled = false;
  const startWithValidator =
    account.aptosResources && account.aptosResources?.stakingPositions.length > 0;
  const label = getStakeLabelLocaleBased();

  const navigationParams: NavigationParamsType = stakingDisabled
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
        NavigatorName.AptosStakingFlow,
        {
          screen: startWithValidator
            ? ScreenName.AptosStakingValidator
            : ScreenName.AptosStakingStarted,
          params: {
            source: parentRoute,
            skipStartedStep: startWithValidator,
          },
        },
      ];
  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey={label} />,
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: {
        currency: "APTOS",
      },
    },
  ];
};

export default {
  getMainActions,
};
