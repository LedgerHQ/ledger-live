import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxUndelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationSuccessPropsType = BaseComposite<
  StackNavigatorProps<
    MultiversxUndelegationFlowParamList,
    ScreenName.MultiversxUndelegationValidationSuccess
  >
>;
