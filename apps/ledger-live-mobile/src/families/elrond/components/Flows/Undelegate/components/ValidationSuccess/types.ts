import type {
  BaseComposite,
  StackNavigatorProps,
} from "../../../../../../../components/RootNavigator/types/helpers";
import type { ElrondUndelegationFlowParamList } from "../../types";
import type { ScreenName } from "../../../../../../../const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    ElrondUndelegationFlowParamList,
    ScreenName.ElrondUndelegationValidationSuccess
  >
>;
