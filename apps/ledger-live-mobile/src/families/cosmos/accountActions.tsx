import React from "react";
import { Trans } from "~/context/Locale";
import { ParamListBase, RouteProp } from "@react-navigation/native";

import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { canDelegate } from "@ledgerhq/live-common/families/cosmos/logic";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: CosmosAccount;
  parentAccount?: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] => {
  // A chain whose runtime rejects delegation must not offer a staking entry point. A currency with
  // no config entry keeps the previous behaviour rather than throwing: getCurrencyConfiguration
  // throws on an absent key, and this decorator also feeds the staking drawer, where nothing else
  // would catch it.
  let configDisablesDelegation = false;
  try {
    const coinConfig = getCurrencyConfiguration(account.currency.id);
    configDisablesDelegation =
      "disableDelegation" in coinConfig && coinConfig.disableDelegation === true;
  } catch (err) {
    console.warn(err);
  }
  if (configDisablesDelegation) return [];

  const delegationDisabled = !canDelegate(account) || !account.cosmosResources;
  const label = getStakeLabelLocaleBased();
  const startWithValidator =
    account.cosmosResources && account.cosmosResources?.delegations.length > 0;
  const isCroAccount = account.type === "Account" && account.currency.id === "crypto_org";

  const getNavParams = (): NavigationParamsType =>
    isCroAccount
      ? [
          ScreenName.PlatformApp,
          {
            params: {
              platform: "stakekit",
              name: "StakeKit",
              accountId: account.id,
              yieldId: "cronos-cro-native-staking",
            },
          },
        ]
      : [
          NavigatorName.CosmosDelegationFlow,
          {
            screen: startWithValidator
              ? ScreenName.CosmosDelegationValidator
              : ScreenName.CosmosDelegationStarted,
            params: {
              source: parentRoute,
              skipStartedStep: startWithValidator,
            },
          },
        ];
  const navigationParams: NavigationParamsType = delegationDisabled
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
    : getNavParams();

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey={label} />,
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: {
        currency: isCroAccount ? "CRO" : "COSMOS",
      },
    },
  ];
};

export default {
  getMainActions,
};
