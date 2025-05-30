type StakingDrawerID = "EvmStakingDrawer";

export type StakingDrawerNavigationProps = {
  id: StakingDrawerID;
  props: {
    accountId: string;
    walletApiAccountId: string;
    singleProviderRedirectMode?: boolean;
    has32Eth?: boolean;
  };
};
