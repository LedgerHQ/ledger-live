import React from "react";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { canStake } from "@ledgerhq/live-common/families/aptos/staking";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
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
  const stakingDisabled = !canStake(account);
  const startWithValidator =
    account.aptosResources && (account.aptosResources?.stakingPositions ?? []).length > 0;
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
        currency: "APT",
      },
    },
  ];
};

export default {
  getMainActions,
};
