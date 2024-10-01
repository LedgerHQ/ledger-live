import type { MultiversxProvider } from "@ledgerhq/live-common/families/multiversx/types";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export interface onSelectType {
  validator: MultiversxProvider;
  return: void;
}

export type PickValidatorPropsType = StackNavigatorProps<
  MultiversxDelegationFlowParamList,
  ScreenName.MultiversxDelegationValidatorList
>;
