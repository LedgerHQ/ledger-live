import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<ElrondClaimRewardsFlowParamList, ScreenName.ElrondClaimRewardsValidationError>
>;
