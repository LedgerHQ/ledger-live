import { StackNavigatorProps } from "../../../../../../../components/RootNavigator/types/helpers";
import { ElrondClaimRewardsFlowParamList } from "../../types";
import { ScreenName } from "../../../../../../../const";

export type ValidationErrorPropsType = StackNavigatorProps<
  ElrondClaimRewardsFlowParamList,
  ScreenName.ElrondClaimRewardsValidator
>;
