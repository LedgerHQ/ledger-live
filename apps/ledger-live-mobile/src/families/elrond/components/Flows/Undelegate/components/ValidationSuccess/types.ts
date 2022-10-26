import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../../../../../components/RootNavigator/types/helpers";
import { ElrondUndelegationFlowParamList } from "../../types";
import { ScreenName } from "../../../../../../../const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    ElrondUndelegationFlowParamList,
    ScreenName.ElrondUndelegationValidationSuccess
  >
>;
