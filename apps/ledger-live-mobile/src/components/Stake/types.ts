type StakingDrawerID = "EvmStakingDrawer";

export type StakingDrawerNavigationProps = {
  id: StakingDrawerID;
  props: {
    accountId: string;
    singleProviderRedirectMode?: boolean;
  };
};
