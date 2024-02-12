import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<ElrondDelegationFlowParamList, ScreenName.ElrondDelegationValidationSuccess>
>;
