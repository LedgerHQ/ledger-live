import { StakingDrawerNavigationProps } from "../Stake/types";

export enum InitialDrawerID {
  PTXServicesAppleDrawerKey = "PTXServicesAppleDrawer",
}

export type EarnInfoDrawerID = "EarnInfoDrawer";

export type EarnInfoDrawerNavigationProps = {
  id: EarnInfoDrawerID;
  props: {
    message: string;
    messageTitle: string;
  };
};

type InitialDrawerProps = { id: InitialDrawerID };

export type DrawerProps =
  | StakingDrawerNavigationProps
  | EarnInfoDrawerNavigationProps
  | InitialDrawerProps;

export type RootDrawerProps = {
  drawer?: DrawerProps;
};
