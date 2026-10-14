import React from "react";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import StacksValidationError from "../shared/ValidationError";
import type { StacksUnstakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<StacksUnstakingFlowParamList, ScreenName.StacksUnstakingValidationError>
>;

export default function ValidationError({ navigation, route }: Props) {
  return (
    <StacksValidationError
      navigation={navigation}
      error={route.params.error}
      category="StacksUnstakingFlow"
      flow="stake"
      action="undelegate"
    />
  );
}
