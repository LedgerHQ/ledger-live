import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../../../../../components/RootNavigator/types/helpers";
import { ElrondWithdrawFlowParamList } from "../../types";
import { ScreenName } from "../../../../../../../const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    ElrondWithdrawFlowParamList,
    ScreenName.ElrondWithdrawValidationSuccess
  >
>;
