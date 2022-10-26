import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../../../../../components/RootNavigator/types/helpers";
import { ElrondWithdrawFlowParamList } from "../../types";
import { ScreenName } from "../../../../../../../const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<
    ElrondWithdrawFlowParamList,
    ScreenName.ElrondWithdrawValidationError
  >
>;
