import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<ElrondDelegationFlowParamList, ScreenName.ElrondDelegationValidationError>
>;
