import type { MultiversXProvider } from "@ledgerhq/live-common/families/multiversx/types";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickValidatorPropsType = StackNavigatorProps<
  MultiversXClaimRewardsFlowParamList,
  ScreenName.MultiversXClaimRewardsValidator
>;

export interface onSelectType {
  validator: MultiversXProvider | undefined;
  value: string;
  return: void;
}
