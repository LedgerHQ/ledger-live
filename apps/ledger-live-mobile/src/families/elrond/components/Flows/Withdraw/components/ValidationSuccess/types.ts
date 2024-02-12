import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ElrondWithdrawFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<ElrondWithdrawFlowParamList, ScreenName.ElrondWithdrawValidationSuccess>
>;
