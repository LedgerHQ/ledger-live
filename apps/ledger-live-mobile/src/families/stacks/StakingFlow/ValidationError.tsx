import React from "react";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import StacksValidationError from "../shared/ValidationError";
import type { StacksStakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<StacksStakingFlowParamList, ScreenName.StacksStakingValidationError>
>;

export default function ValidationError({ navigation, route }: Props) {
  return (
    <StacksValidationError
      navigation={navigation}
      error={route.params.error}
      category="StacksStakingFlow"
      flow="stake"
      action="delegate"
    />
  );
}
