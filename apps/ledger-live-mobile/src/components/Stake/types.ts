export type StakingDrawerID = "EthStakingDrawer";

export type StakingDrawerNavigationProps = {
  id: StakingDrawerID;
  props: {
    accountId: string;
    singleProviderRedirectMode?: boolean;
  };
};
