import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AssetCategory } from "@domain/api-aggregated-assets";
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
        navigate(ScreenName.PayTabRequestReceive, { account, parentAccount });
      },
    });
  }, [openDrawer, navigate]);

  return { open };
}
