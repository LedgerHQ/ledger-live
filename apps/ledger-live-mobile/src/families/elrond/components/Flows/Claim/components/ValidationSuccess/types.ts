import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    ElrondClaimRewardsFlowParamList,
    ScreenName.ElrondClaimRewardsValidationSuccess
  >
>;
