import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxWithdrawFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<MultiversxWithdrawFlowParamList, ScreenName.MultiversxWithdrawValidationError>
>;
