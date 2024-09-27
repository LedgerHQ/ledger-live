import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversxDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<
    MultiversxDelegationFlowParamList,
    ScreenName.MultiversxDelegationValidationError
  >
>;
