import type { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickValidatorPropsType = StackNavigatorProps<
  ElrondClaimRewardsFlowParamList,
  ScreenName.ElrondClaimRewardsValidator
>;

export interface onSelectType {
  validator: ElrondProvider | undefined;
  value: string;
  return: void;
}
