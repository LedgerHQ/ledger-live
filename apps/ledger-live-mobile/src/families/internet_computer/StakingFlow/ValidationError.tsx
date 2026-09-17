import React, { useCallback } from "react";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import ICPValidationError from "../components/ValidationError";
import type { InternetComputerStakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerStakingFlowParamList,
    ScreenName.InternetComputerStakingValidationError
  >
>;

export default function ValidationError(props: Props) {
  const { navigation, route } = props;

  // A create_neuron that was signed but never confirmed cannot be retried, and Close alone lands on
  // the account page, where the stake banner is the only thing on offer — so the one exit invited a
  // second stake rather than a look at the first. The neuron list holds Refresh neurons, the only
  // thing that can say whether the neuron exists. `replace` because the staking flow is over either
  // way, which also leaves Back pointing at the account page rather than back into the failure.
  const onBackToList = useCallback(
    () =>
      navigation
        .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
        .replace(NavigatorName.InternetComputerNeuronManageFlow, {
          screen: ScreenName.InternetComputerNeuronList,
          params: { accountId: route.params.accountId, parentId: route.params.parentId },
        }),
    [navigation, route.params.accountId, route.params.parentId],
  );

  return (
    <ICPValidationError
      {...props}
      category="Staking ICP Flow"
      action="create_neuron"
      onBackToList={onBackToList}
    />
  );
}
