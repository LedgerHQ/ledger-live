import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxWithdrawFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    MultiversxWithdrawFlowParamList,
    ScreenName.MultiversxWithdrawValidationSuccess
  >
>;
