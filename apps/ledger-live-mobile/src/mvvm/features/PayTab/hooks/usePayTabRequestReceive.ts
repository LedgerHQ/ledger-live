import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { ScreenName } from "~/const";
import type { PayTabNavigatorParamList } from "../types";

const REQUEST_PAGE = "Pay";
const REQUEST_CATEGORIES: AssetCategory[] = [AssetCategory.Stablecoins];

export type UsePayTabRequestReceive = Readonly<{
  open: () => void;
}>;

export function usePayTabRequestReceive(): UsePayTabRequestReceive {
  const { navigate } = useNavigation<NativeStackNavigationProp<PayTabNavigatorParamList>>();
  const { openDrawer } = useModularDrawerController();

  const open = useCallback(() => {
    openDrawer({
      categories: REQUEST_CATEGORIES,
      flow: "request",
      source: REQUEST_PAGE,
      enableAccountSelection: true,
      onAccountSelected: (account, parentAccount) => {
        const accountCurrency = getAccountCurrency(account);
        navigate(ScreenName.PayTabRequestReceive, {
          parentId: parentAccount?.id,
          currency: accountCurrency,
          // Token (USDC) may not be in the wallet yet. Use the parent (ETH) id instead.
          accountId: (account.type !== "Account" && account.parentId) || account.id,
        });
      },
    });
  }, [openDrawer, navigate]);

  return { open };
}
