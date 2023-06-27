import React from "react";

import { StakingDrawerNavigationProps } from "./Stake/types";
import { EthereumStakingDrawer } from "../families/ethereum/EthereumStakingDrawer";

import { RootDrawerProvider, useRootDrawerContext } from "../context/RootDrawerContext";

export type RootDrawerProps = StakingDrawerNavigationProps;

type Props = {
  drawer?: RootDrawerProps;
};

export function RootDrawerSelector() {
  const { drawer } = useRootDrawerContext();
  switch (drawer.id) {
    case "EthStakingDrawer":
      return <EthereumStakingDrawer />;
    default:
      return null;
  }
}

export function RootDrawer({ drawer }: Props) {
  return (
    <RootDrawerProvider drawer={drawer}>
      <RootDrawerSelector />
    </RootDrawerProvider>
  );
}
