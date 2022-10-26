import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../../../../../components/RootNavigator/types/helpers";
import { ElrondDelegationFlowParamList } from "../../types";
import { ScreenName } from "../../../../../../../const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    ElrondDelegationFlowParamList,
    ScreenName.ElrondDelegationValidationSuccess
  >
>;
