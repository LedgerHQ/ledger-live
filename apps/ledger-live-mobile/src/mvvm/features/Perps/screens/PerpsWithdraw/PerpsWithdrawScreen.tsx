import React from "react";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { PerpsWithdrawView } from ".";
import { usePerpsWithdrawViewModel } from "./usePerpsWithdrawViewModel";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsWithdraw>
>;

export default function PerpsWithdrawScreen(props: NavigationProps) {
  const viewModel = usePerpsWithdrawViewModel(props);
  return <PerpsWithdrawView {...viewModel} />;
}
