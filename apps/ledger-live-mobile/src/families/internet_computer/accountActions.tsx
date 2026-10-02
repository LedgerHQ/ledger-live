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

// ICP staking entry points, gated behind the `llmIcpStaking` feature flag.
// Follows the mobile idiom (near/solana/cosmos): the Stake action is always present and routes to
// NoFundsFlow when the account can't afford a neuron.
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
      eventProperties: { currency: "ICP" },
    },
  ];

  // Not gated on the neuron count: neurons only arrive via a device-signed list_neurons, whose Sync
  // button lives inside the screen this opens, so gating here makes a first neuron unreachable. The
  // list renders its own empty state.
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
    // Not CoinsMedium, which the Stake action beside it already uses. A stack reads as the several
    // positions this opens, without the outgoing-arrow sense of DelegateMedium.
    Icon: IconsLegacy.LayersMedium,
    eventProperties: { currency: "ICP" },
  });

  return actions;
};

export default {
  getMainActions,
};
