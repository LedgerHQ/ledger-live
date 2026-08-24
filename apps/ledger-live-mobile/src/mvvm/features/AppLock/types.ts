import type { ScreenName } from "~/const";
import type { PasswordAddFlowParamList } from "~/components/RootNavigator/types/PasswordAddFlowNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

export type PasswordAddFlowNavigatorProps = StackNavigatorProps<
  PasswordAddFlowParamList,
  ScreenName.PasswordAdd | ScreenName.ConfirmPassword
>;
