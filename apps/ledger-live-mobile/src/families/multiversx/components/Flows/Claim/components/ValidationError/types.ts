import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<
    MultiversXClaimRewardsFlowParamList,
    ScreenName.MultiversXClaimRewardsValidationError
  >
>;
