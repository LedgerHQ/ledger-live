import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type ExchangeStackNavigatorParamList = {
  [ScreenName.ExchangeSelectCurrency]: {
    currency?: string;
    mode: "buy" | "sell";
    onCurrencyChange: (_: CryptoCurrency | TokenCurrency) => void;
  };
  [ScreenName.ExchangeSelectAccount]: {
    mode?: "buy" | "sell";
    currency: CryptoCurrency | TokenCurrency;
    onAccountChange?: (_: Account | AccountLike) => void;
    analyticsPropertyFlow?: string;
  };
};
