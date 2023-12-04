import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { NavigatorName, ScreenName } from "../../const";
import { NavigationParamsType } from "../../components/FabActions";

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: CardanoAccount;
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}) => {
  const isAlreadyDelegated = !!account.cardanoResources?.delegation?.poolId;

  const navigationParams: NavigationParamsType = [
    NavigatorName.CardanoDelegationFlow,
    {
      screen: isAlreadyDelegated
        ? ScreenName.CardanoDelegationSummary
        : ScreenName.CardanoDelegationStarted,
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
      label: <Trans i18nKey="account.stake" />,
      Icon: IconsLegacy.CoinsMedium,
      event: "button_clicked",
      eventProperties: {
        button: "stake",
        currency: "ADA",
        page: "Account Page",
      },
    },
  ];
};

export default {
  getMainActions,
};
