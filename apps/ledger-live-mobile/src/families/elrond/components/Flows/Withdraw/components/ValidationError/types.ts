import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondWithdrawFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<ElrondWithdrawFlowParamList, ScreenName.ElrondWithdrawValidationError>
>;
