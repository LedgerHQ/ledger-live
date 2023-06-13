import React from "react";

import { StakingDrawerNavigationProps } from "./types";
import { EthereumStakingDrawer } from "../../families/ethereum/EthereumStakingDrawer";

type Props = {
  stakingDrawer?: StakingDrawerNavigationProps;
};

export function StakeDrawer({ stakingDrawer }: Props) {
  if (!stakingDrawer) {
    return null;
  }
  switch (stakingDrawer.id) {
    case "EthStakingDrawer":
      return <EthereumStakingDrawer stakingDrawer={stakingDrawer} />;
    default:
      return null;
  }
}
