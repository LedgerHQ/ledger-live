import React from "react";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import ICPValidationError from "../components/ValidationError";
import type { InternetComputerStakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerStakingFlowParamList,
    ScreenName.InternetComputerStakingValidationError
  >
>;

export default function ValidationError(props: Props) {
  return <ICPValidationError {...props} category="Staking ICP Flow" action="create_neuron" />;
}
