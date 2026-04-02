import React from "react";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { PerpsSignView } from ".";
import { usePerpsSignViewModel } from "./usePerpsSignViewModel";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsSign>
>;

export default function PerpsSignScreen(props: NavigationProps) {
  const viewModel = usePerpsSignViewModel(props);
  return <PerpsSignView {...viewModel} />;
}
