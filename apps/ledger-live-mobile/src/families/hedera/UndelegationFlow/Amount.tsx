import React from "react";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { HederaUndelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  HederaUndelegationFlowParamList,
  ScreenName.HederaUndelegationAmount
>;

function UndelegationAmount({ navigation, route }: Props) {
  return null;
}

export default UndelegationAmount;
