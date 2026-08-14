import React from "react";
import { Trans } from "~/context/Locale";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { canStakeICP } from "@ledgerhq/live-common/families/internet_computer/react";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import type { Account } from "@ledgerhq/types-live";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

// ICP staking entry points (LIVE-29097), gated behind the `llmIcpStaking` feature flag.
// Follows the mobile idiom (near/solana/cosmos): the Stake action is always present and routes to
// NoFundsFlow when the account can't afford a neuron. Manage Neurons appears only once neurons
// exist (matching desktop LIVE-29095). Both staking flows are stubs until LIVE-29098.
const getMainActions = ({
  account,
  parentAccount,
  parentRoute,
  llmIcpStaking,
}: {
  account: ICPAccount;
  parentAccount?: Account;
  parentRoute?: RouteProp<ParamListBase, ScreenName>;
  llmIcpStaking?: { enabled?: boolean } | null;
}): ActionButtonEvent[] => {
  if (!llmIcpStaking?.enabled || account.type !== "Account") return [];

  const label = getStakeLabelLocaleBased();

  const stakeNavigationParams: NavigationParamsType = canStakeICP(account)
    ? [
        NavigatorName.InternetComputerStakingFlow,
        {
          screen: ScreenName.InternetComputerStakingStarted,
          params: { accountId: account.id, source: parentRoute },
        },
      ]
    : [
        NavigatorName.NoFundsFlow,
        {
          screen: ScreenName.NoFunds,
          params: { account, parentAccount },
        },
      ];

  const actions: ActionButtonEvent[] = [
    {
      id: "stake",
      navigationParams: stakeNavigationParams,
      label: <Trans i18nKey={label} />,
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: { currency: "INTERNET_COMPUTER" },
    },
  ];

  if (account.neurons?.fullNeurons.length) {
    actions.push({
      id: "manage-neurons",
      navigationParams: [
        NavigatorName.InternetComputerNeuronManageFlow,
        {
          screen: ScreenName.InternetComputerNeuronList,
          params: { accountId: account.id, source: parentRoute },
        },
      ],
      label: <Trans i18nKey="internetComputer.headerManageActions.manageNeurons.title" />,
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: { currency: "INTERNET_COMPUTER" },
    });
  }

  return actions;
};

export default {
  getMainActions,
};
