import React from "react";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { PredictionsOrderResultView } from ".";
import { usePredictionsOrderResultViewModel } from "./usePredictionsOrderResultViewModel";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PredictionsOrderResult>
>;

export default function PredictionsOrderResultScreen(props: NavigationProps) {
  const viewModel = usePredictionsOrderResultViewModel(props);
  return <PredictionsOrderResultView {...viewModel} />;
}
