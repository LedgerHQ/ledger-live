import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "~/const";

export type EarnLiveAppNavigatorParamList = {
  [ScreenName.Earn]: {
    accountId?: string;
    action?:
      | "get-funds"
      | "stake"
      | "stake-account"
      | "info-modal"
      | "menu-modal"
      | "go-back"
      | "deposit"
      | "simulate";
    currencyId?: string;
    learnMore?: string;
    message?: string;
    messageTitle?: string;
    platform?: string;
    intent?: "deposit" | "withdraw" | "simulate";
    cryptoAssetId?: TokenCurrency["id"]; // Only for deposit/withdraw flows
    customDappURL?: string;
    customDappUrl?: string;
  };
};
