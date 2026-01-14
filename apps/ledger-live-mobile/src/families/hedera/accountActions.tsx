import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import { NavigatorName, ScreenName } from "~/const";
import type { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { DisabledDelegationModal } from "./shared/DisabledDelegationModal";

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: HederaAccount;
  parentAccount?: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] => {
  const currency = getAccountCurrency(account);
  const label = getStakeLabelLocaleBased();
  const hasNoFunds = account.spendableBalance.isZero();
  const isAlreadyDelegated = !!account.hederaResources?.delegation;

  const navigationParams: NavigationParamsType = (() => {
    if (isAlreadyDelegated) {
      return [
        NavigatorName.Accounts,
        {
          screen: ScreenName.Account,
          params: {
            currencyId: currency.id,
            accountId: account.id,
            parentId: parentAccount?.id,
            source: parentRoute,
          },
        },
      ];
    }

    if (hasNoFunds)
      return [
        NavigatorName.NoFundsFlow,
        {
          screen: ScreenName.NoFunds,
          params: {
            account,
            parentAccount,
            source: parentRoute,
          },
        },
      ];

    return [
      NavigatorName.HederaDelegationFlow,
      {
        screen: ScreenName.HederaDelegationSummary,
        params: {
          accountId: account.id,
          parentId: parentAccount?.id,
          source: parentRoute,
        },
      },
    ];
  })();

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey={label} />,
      disabled: isAlreadyDelegated,
      modalOnDisabledClick: {
        component: DisabledDelegationModal,
      },
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: {
        currency: "hedera",
      },
    },
  ];
};

export default {
  getMainActions,
};
