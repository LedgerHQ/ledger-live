import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXWithdrawFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    MultiversXWithdrawFlowParamList,
    ScreenName.MultiversXWithdrawValidationSuccess
  >
>;
