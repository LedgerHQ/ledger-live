import type { StackNavigatorProps } from "../../../../../../../components/RootNavigator/types/helpers";
import type { ElrondUndelegationFlowParamList } from "../../types";
import type { ScreenName } from "../../../../../../../const";

export type PickAmountPropsType = StackNavigatorProps<
  ElrondUndelegationFlowParamList,
  ScreenName.ElrondUndelegationAmount
>;
