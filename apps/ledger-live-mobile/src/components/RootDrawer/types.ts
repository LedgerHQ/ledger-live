import { StakingDrawerNavigationProps } from "../Stake/types";

export enum InitialDrawerID {
  PTXServicesAppleDrawerKey = "PTXServicesAppleDrawer",
}

type InitialDrawerProps = { id: InitialDrawerID };

export type DrawerProps = StakingDrawerNavigationProps | InitialDrawerProps;

export type RootDrawerProps = {
  drawer?: DrawerProps;
};
