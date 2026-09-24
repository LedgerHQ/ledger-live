import React from "react";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AleoValidationError from "../shared/ValidationError";
import type { AleoClaimUnbondFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoClaimUnbondFlowParamList, ScreenName.AleoClaimUnbondValidationError>
>;

export default function ValidationError({ navigation, route }: Props) {
  return (
    <AleoValidationError
      navigation={navigation}
      error={route.params.error}
      category="ClaimUnbondFlow"
      flow="claim"
      action="claiming"
    />
  );
}
