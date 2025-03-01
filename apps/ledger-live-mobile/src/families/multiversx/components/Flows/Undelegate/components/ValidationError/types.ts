import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXUndelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type ValidationErrorPropsType = BaseComposite<
  StackNavigatorProps<
    MultiversXUndelegationFlowParamList,
    ScreenName.MultiversXUndelegationValidationError
  >
>;
