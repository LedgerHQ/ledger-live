import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    MultiversxClaimRewardsFlowParamList,
    ScreenName.MultiversxClaimRewardsValidationSuccess
  >
>;
