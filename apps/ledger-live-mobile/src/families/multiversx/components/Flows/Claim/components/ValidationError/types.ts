import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<
    MultiversxClaimRewardsFlowParamList,
    ScreenName.MultiversxClaimRewardsValidationError
  >
>;
