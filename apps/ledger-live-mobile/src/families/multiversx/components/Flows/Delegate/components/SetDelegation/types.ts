import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { MultiversXDelegationFlowParamList } from "../../types";
import type { ScreenName } from "~/const";

export type SetDelegationPropsType = StackNavigatorProps<
  MultiversXDelegationFlowParamList,
  ScreenName.MultiversXDelegationValidator
>;
