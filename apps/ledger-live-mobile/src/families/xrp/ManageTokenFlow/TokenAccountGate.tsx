import React, { useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { getManagedTokenAccounts } from "@ledgerhq/live-common/families/xrp/tokens";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { TokenAccountParams, XrpManageTokenFlowParamList } from "./types";

type Navigation = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenSettings>
>["navigation"];

/** A sync can remove the trust line under an open editor: leave it rather than edit one the ledger no longer reports. */
export default function TokenAccountGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProp<Record<string, TokenAccountParams>, string>>();
  const { account, parentAccount } = useAccountScreen(route);
  const managedTokenAccounts = parentAccount ? getManagedTokenAccounts(parentAccount) : [];
  const isManaged = managedTokenAccounts.some(tokenAccount => tokenAccount.id === account?.id);
  const isAvailable = account?.type === "TokenAccount" && isManaged;
  const { parentId } = route.params;

  useEffect(() => {
    if (!isAvailable) navigation.popTo(ScreenName.XrpManageTokenList, { accountId: parentId });
  }, [isAvailable, navigation, parentId]);

  return isAvailable ? children : null;
}
