import React from "react";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import ICPConnectDevice from "../components/ConnectDevice";
import type { InternetComputerStakingFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerStakingFlowParamList,
  ScreenName.InternetComputerStakingConnectDevice
>;

export default function ConnectDevice(props: Props) {
  return <ICPConnectDevice {...props} category="Staking ICP Flow" />;
}
