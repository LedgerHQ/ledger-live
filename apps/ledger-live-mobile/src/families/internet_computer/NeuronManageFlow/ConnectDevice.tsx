import React from "react";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import ICPConnectDevice from "../components/ConnectDevice";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronConnectDevice
>;

export default function ConnectDevice(props: Props) {
  return <ICPConnectDevice {...props} category="Manage Neurons ICP Flow" />;
}
