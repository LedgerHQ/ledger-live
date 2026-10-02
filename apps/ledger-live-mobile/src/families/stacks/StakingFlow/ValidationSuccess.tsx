import React from "react";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import StacksValidationSuccess from "../shared/ValidationSuccess";
import type { StacksStakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<StacksStakingFlowParamList, ScreenName.StacksStakingValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  return (
    <StacksValidationSuccess
      navigation={navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()}
      route={route}
      variant="stake"
    />
  );
}
