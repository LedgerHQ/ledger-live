import { ScreenName } from "~/const";

export type TokenAccountParams = {
  accountId: string;
  parentId: string;
};

// The limit is a base-units string: route params must stay serializable, a BigNumber is not
type BalanceLimit = Readonly<{ limit: string }>;

export type XrpManageTokenFlowParamList = {
  [ScreenName.XrpManageTokenList]: { accountId: string };
  [ScreenName.XrpManageTokenSettings]: TokenAccountParams & {
    balanceLimit?: BalanceLimit;
  };
  [ScreenName.XrpManageTokenBalanceLimit]: TokenAccountParams & {
    balanceLimit: BalanceLimit;
  };
};
