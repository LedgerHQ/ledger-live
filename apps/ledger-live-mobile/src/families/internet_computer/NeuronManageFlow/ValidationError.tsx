import type { ICPTransactionType } from "@ledgerhq/live-common/families/internet_computer/types";
import React, { useCallback } from "react";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import ICPValidationError from "../components/ValidationError";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronValidationError
  >
>;

/**
 * The screen that collected each action's input, so a value the user needs to change can be changed.
 * Anything absent took no input and retries at the device screen, which is one step back.
 *
 * Every entry is a screen in this navigator, which is why the map lives here: only the flow that
 * registers a screen can `popTo` it. Typed against this flow's own param list so that stays a
 * compiler error rather than a convention.
 */
const RETRY_SCREEN: Partial<
  Record<ICPTransactionType, keyof InternetComputerNeuronManageFlowParamList>
> = {
  increase_stake: ScreenName.InternetComputerNeuronIncreaseStake,
  set_dissolve_delay: ScreenName.InternetComputerNeuronSetDissolveDelay,
  increase_dissolve_delay: ScreenName.InternetComputerNeuronSetDissolveDelay,
  stake_maturity: ScreenName.InternetComputerNeuronStakeMaturity,
  split_neuron: ScreenName.InternetComputerNeuronSplit,
  add_hot_key: ScreenName.InternetComputerNeuronAddHotKey,
  // Back to the followee list rather than the topic picker: the topic is already chosen and the list
  // it holds is what a retry is likely to be correcting.
  follow: ScreenName.InternetComputerNeuronFollowees,
  refresh_voting_power: ScreenName.InternetComputerNeuronRefreshVotingPower,
};

export default function ValidationError(props: Props) {
  const { navigation, route } = props;

  // Offered in place of Retry when the attempt must not be repeated: the list is where Refresh
  // neurons lives, which is the only thing that establishes what the command actually did.
  const onBackToList = useCallback(
    () =>
      navigation.popTo(ScreenName.InternetComputerNeuronList, {
        accountId: route.params.accountId,
        parentId: route.params.parentId,
      }),
    [navigation, route.params.accountId, route.params.parentId],
  );

  return (
    <ICPValidationError
      {...props}
      category="Manage Neurons ICP Flow"
      action={props.route.params.transaction?.type}
      onBackToList={onBackToList}
      retryScreens={RETRY_SCREEN}
    />
  );
}
