import type { TokenCurrency } from "@domain/entity-currency-token";
import { ScreenName } from "~/const";

// The limit is a base-units string: route params must stay serializable, a BigNumber is not
type BalanceLimit = Readonly<{ limit: string }>;

export type XrpAddTokenFlowParamList = {
  [ScreenName.XrpAddTokenSelectToken]: {
    accountId: string;
  };
  [ScreenName.XrpAddTokenReview]: {
    accountId: string;
    token: TokenCurrency;
    balanceLimit?: BalanceLimit;
  };
  [ScreenName.XrpAddTokenBalanceLimit]: {
    accountId: string;
    token: TokenCurrency;
    balanceLimit: BalanceLimit;
  };
  [ScreenName.XrpAddTokenConfirmation]: {
    accountId: string;
  };
};
