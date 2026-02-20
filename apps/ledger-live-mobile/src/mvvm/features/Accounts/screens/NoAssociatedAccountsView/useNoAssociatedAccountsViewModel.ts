import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { getAddAccountCallbacks } from "~/navigation/callbackRegistry";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { useTheme } from "styled-components/native";

export type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.NoAssociatedAccounts>
>;

export default function useNoAssociatedAccountsViewModel({ route }: Props) {
  const {
    CustomNoAssociatedAccounts,
    onCloseNavigation: onCloseParam,
    callbackId,
  } = route.params || {};
  const registryCallbacks = callbackId ? getAddAccountCallbacks(callbackId) : undefined;
  const onCloseNavigation = registryCallbacks?.onCloseNavigation ?? onCloseParam;
  const { colors, space } = useTheme();

  const statusColor = colors.primary.c70;

  return {
    statusColor,
    space,
    CustomNoAssociatedAccounts,
    onCloseNavigation,
  };
}
