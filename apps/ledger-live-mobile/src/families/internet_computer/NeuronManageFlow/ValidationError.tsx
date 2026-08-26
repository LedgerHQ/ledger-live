import React from "react";
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
  return (
    <ICPValidationError
      {...props}
      category="Manage Neurons ICP Flow"
      action={props.route.params.transaction?.type}
    />
  );
}
