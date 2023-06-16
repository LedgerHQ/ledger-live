import React from "react";

import { StakingDrawerNavigationProps } from "./Stake/types";
import { EthereumStakingDrawer } from "../families/ethereum/EthereumStakingDrawer";

export type RootDrawerProps = StakingDrawerNavigationProps;

type Props = {
  drawer?: RootDrawerProps;
};

export function RootDrawer({ drawer }: Props) {
  if (!drawer) {
    return null;
  }
  switch (drawer.id) {
    case "EthStakingDrawer":
      return <EthereumStakingDrawer drawer={drawer} />;
    default:
      return null;
  }
}
