import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXClaimRewardsFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    MultiversXClaimRewardsFlowParamList,
    ScreenName.MultiversXClaimRewardsValidationSuccess
  >
>;
