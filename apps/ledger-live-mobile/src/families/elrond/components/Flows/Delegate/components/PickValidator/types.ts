import type { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export interface onSelectType {
  validator: ElrondProvider;
  return: void;
}

export type PickValidatorPropsType = StackNavigatorProps<
  ElrondDelegationFlowParamList,
  ScreenName.ElrondDelegationValidatorList
>;
