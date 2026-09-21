import React from "react";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { PerpsTransactionSignedView } from ".";
import { usePerpsTransactionSignedViewModel } from "./usePerpsTransactionSignedViewModel";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsTransactionSigned>
>;

export default function PerpsTransactionSignedScreen(props: NavigationProps) {
  const viewModel = usePerpsTransactionSignedViewModel(props);
  return <PerpsTransactionSignedView {...viewModel} />;
}
