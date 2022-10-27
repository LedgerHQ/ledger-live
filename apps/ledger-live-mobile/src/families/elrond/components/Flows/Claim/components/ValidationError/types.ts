import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../../../../../components/RootNavigator/types/helpers";
import { ElrondClaimRewardsFlowParamList } from "../../types";
import { ScreenName } from "../../../../../../../const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<
    ElrondClaimRewardsFlowParamList,
    ScreenName.ElrondClaimRewardsValidationError
  >
>;
