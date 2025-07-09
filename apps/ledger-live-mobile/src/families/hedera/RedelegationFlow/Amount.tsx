import React from "react";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { HederaRedelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  HederaRedelegationFlowParamList,
  ScreenName.HederaRedelegationAmount
>;

function RedelegationAmount({ navigation, route }: Props) {
  return null;
}

export default RedelegationAmount;
