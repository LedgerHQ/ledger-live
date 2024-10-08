import type { MultiversXProvider } from "@ledgerhq/live-common/families/multiversx/types";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export interface onSelectType {
  validator: MultiversXProvider;
  return: void;
}

export type PickValidatorPropsType = StackNavigatorProps<
  MultiversXDelegationFlowParamList,
  ScreenName.MultiversXDelegationValidatorList
>;
