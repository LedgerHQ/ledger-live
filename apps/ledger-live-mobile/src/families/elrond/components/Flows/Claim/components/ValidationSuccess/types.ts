import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../../../../../components/RootNavigator/types/helpers";
import { ElrondClaimRewardsFlowParamList } from "../../types";
import { ScreenName } from "../../../../../../../const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    ElrondClaimRewardsFlowParamList,
    ScreenName.ElrondClaimRewardsValidationSuccess
  >
>;
