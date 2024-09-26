import type { MultiversxProvider } from "@ledgerhq/live-common/families/elrond/types";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export interface onSelectType {
  validator: MultiversxProvider;
  return: void;
}

export type PickValidatorPropsType = StackNavigatorProps<
  ElrondDelegationFlowParamList,
  ScreenName.ElrondDelegationValidatorList
>;
