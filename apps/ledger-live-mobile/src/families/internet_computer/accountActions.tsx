import {
  ICP_FEES,
  ICP_MIN_STAKING_AMOUNT,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { IconsLegacy } from "@ledgerhq/native-ui";
import type { Account } from "@ledgerhq/types-live";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import React from "react";
import { Trans } from "react-i18next";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

function canStakeICP(account: ICPAccount): boolean {
  const spendable = account.spendableBalance.minus(ICP_FEES);
  return spendable.gte(ICP_MIN_STAKING_AMOUNT);
}

const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
}: {
  account: ICPAccount;
  parentAccount: Account;
  parentRoute: RouteProp<ParamListBase, ScreenName>;
}): ActionButtonEvent[] => {
  const stakingDisabled = !canStakeICP(account);
  const hasNeurons = account.neurons?.fullNeurons && account.neurons.fullNeurons.length > 0;
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
        NavigatorName.InternetComputerStakingFlow,
        {
          screen: hasNeurons
            ? ScreenName.InternetComputerStakingAmount
            : ScreenName.InternetComputerStakingStarted,
          params: {
            source: parentRoute,
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
        currency: "ICP",
      },
    },
    {
      id: "manage-neurons",
      navigationParams: [
        NavigatorName.InternetComputerNeuronManageFlow,
        {
          screen: ScreenName.InternetComputerNeuronList,
          params: {
            accountId: account.id,
          },
        },
      ],
      label: <Trans i18nKey="icp.staking.actions.manageNeurons" />,
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: {
        currency: "ICP",
      },
    },
  ];
};

export default {
  getMainActions,
};
