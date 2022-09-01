import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "../../../const";
import { Target } from "../../../screens/Swap/types";

export type SwapFormNavigatorParamList = {
  [ScreenName.SwapForm]: {
    accountId?: string;
    currency?: CryptoCurrency | TokenCurrency;
    rate?: ExchangeRate;
    transaction?: Transaction;
    target?: Target;
  };
  [ScreenName.SwapHistory]: undefined;
};
