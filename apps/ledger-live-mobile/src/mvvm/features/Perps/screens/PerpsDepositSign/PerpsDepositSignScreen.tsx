import React from "react";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { PerpsDepositSignView } from ".";
import { usePerpsDepositSignViewModel } from "./usePerpsDepositSignViewModel";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsDepositSign>
>;

export default function PerpsDepositSignScreen(props: NavigationProps) {
  const viewModel = usePerpsDepositSignViewModel(props);
  return <PerpsDepositSignView {...viewModel} />;
}
