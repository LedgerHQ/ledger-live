import React from "react";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OperationsListNavigator } from "./types";

type Props = StackNavigatorProps<OperationsListNavigator, ScreenName.OperationsList>;

export default function OperationsList(_: Props) {
  return <TrackScreen name="OperationsList" />;
}
