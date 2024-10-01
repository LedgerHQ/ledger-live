import type { MultiversxProvider } from "@ledgerhq/live-common/families/multiversx/types";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type PickValidatorPropsType = StackNavigatorProps<
  MultiversxClaimRewardsFlowParamList,
  ScreenName.MultiversxClaimRewardsValidator
>;

export interface onSelectType {
  validator: MultiversxProvider | undefined;
  value: string;
  return: void;
}
