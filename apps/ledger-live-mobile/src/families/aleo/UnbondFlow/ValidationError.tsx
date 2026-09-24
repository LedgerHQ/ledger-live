import React from "react";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AleoValidationError from "../shared/ValidationError";
import type { AleoUnbondFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoUnbondFlowParamList, ScreenName.AleoUnbondValidationError>
>;

export default function ValidationError({ navigation, route }: Props) {
  return (
    <AleoValidationError
      navigation={navigation}
      error={route.params.error}
      category="UnbondFlow"
      flow="unbond"
      action="unbonding"
    />
  );
}
