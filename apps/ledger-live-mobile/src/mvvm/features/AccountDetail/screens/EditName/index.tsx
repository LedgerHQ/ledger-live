import React, { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import { useTranslation } from "~/context/Locale";
import type { ScreenName } from "~/const";
import type { AccountDetailNavigatorParamsList } from "../../types";
import { EditNameView } from "./EditNameView";
import { useEditNameViewModel } from "./useEditNameViewModel";

type NavigationProps = NativeStackNavigationProp<
  AccountDetailNavigatorParamsList,
  ScreenName.AccountDetailEditName
>;

export default function EditName() {
  const { account, ...viewModel } = useEditNameViewModel();
  const navigation = useNavigation<NavigationProps>();
  const { t } = useTranslation();
  const ticker = account?.currency.ticker;

  useLayoutEffect(() => {
    if (!ticker) return;
    const options: Partial<LumenNativeStackNavigationOptions> = {
      lumenNavBar: {
        density: "expanded",
        description: t("accountDetail.editName.description", { ticker }),
      },
    };
    navigation.setOptions(options);
  }, [navigation, t, ticker]);

  if (!account) return null;

  return <EditNameView {...viewModel} />;
}
