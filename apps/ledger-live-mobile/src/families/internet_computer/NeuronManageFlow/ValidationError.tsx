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

export default function ValidationError(props: Props) {
  const { navigation, route } = props;

  // Offered in place of Retry when the attempt must not be repeated: the list is where Refresh
  // neurons lives, which is the only thing that establishes what the command actually did.
  const onBackToList = useCallback(
    () =>
      navigation.navigate(ScreenName.InternetComputerNeuronList, {
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
    />
  );
}
