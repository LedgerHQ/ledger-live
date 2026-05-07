import React from "react";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import useLiveAppModalViewModel from "./useLiveAppModalViewModel";
import LiveAppModalView from "./LiveAppModalView";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.LiveAppModal>;

const LiveAppModalScreen = ({ navigation }: Props) => (
  <LiveAppModalView {...useLiveAppModalViewModel(navigation)} />
);

export default LiveAppModalScreen;
