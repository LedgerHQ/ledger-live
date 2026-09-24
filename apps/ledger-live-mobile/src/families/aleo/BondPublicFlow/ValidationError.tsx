import React from "react";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AleoValidationError from "../shared/ValidationError";
import type { AleoBondPublicFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoBondPublicFlowParamList, ScreenName.AleoBondPublicValidationError>
>;

export default function ValidationError({ navigation, route }: Props) {
  return (
    <AleoValidationError
      navigation={navigation}
      error={route.params.error}
      category="BondPublicFlow"
      flow="stake"
      action="bond"
    />
  );
}
