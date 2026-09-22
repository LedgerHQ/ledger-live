import type { ScreenName } from "~/const";
import type { PasswordAddFlowParamList } from "~/components/RootNavigator/types/PasswordAddFlowNavigator";
import type { PasswordModifyFlowParamList } from "~/components/RootNavigator/types/PasswordModifyFlowNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

export type PasswordAddFlowNavigatorProps = StackNavigatorProps<
  PasswordAddFlowParamList,
  ScreenName.PasswordAdd | ScreenName.ConfirmPassword
>;

export type PasswordModifyFlowNavigatorProps = StackNavigatorProps<
  PasswordModifyFlowParamList,
  ScreenName.PasswordRemove
>;
