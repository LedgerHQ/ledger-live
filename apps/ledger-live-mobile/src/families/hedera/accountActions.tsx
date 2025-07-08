import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
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
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] => {
  const label = getStakeLabelLocaleBased();
  const hasNoFunds = account.spendableBalance.isZero();

  const navigationParams: NavigationParamsType = hasNoFunds
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
        NavigatorName.HederaDelegationFlow,
        {
          screen: ScreenName.DelegationSummary,
          params: {
            accountId: account.id,
            parentId: parentAccount ? parentAccount.id : undefined,
            source: parentRoute,
          },
        },
      ];

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey={label} />,
      disabled: !!account.hederaResources?.delegation,
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
