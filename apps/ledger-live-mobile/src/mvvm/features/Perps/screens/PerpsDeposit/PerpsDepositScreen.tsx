import React from "react";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { PerpsDepositView } from ".";
import { usePerpsDepositViewModel } from "./usePerpsDepositViewModel";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsDeposit>
>;

export default function PerpsDepositScreen(props: NavigationProps) {
  const viewModel = usePerpsDepositViewModel(props);
  return <PerpsDepositView {...viewModel} />;
}
