import { SwapDataType } from "@ledgerhq/live-common/exchange/swap/hooks/useSwapTransaction";
import {
  AvailableProvider,
  ExchangeRate,
  SwapTransaction,
} from "@ledgerhq/live-common/exchange/swap/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type SwapFormNavigatorParamList = {
  [ScreenName.SwapForm]: {
    defaultAccount?: AccountLike;
    defaultParentAccount?: Account;
    providers: AvailableProvider[];
    provider: string;
    swap?: SwapDataType;
    transaction?: SwapTransaction;
    rate?: ExchangeRate;
  };
  [ScreenName.SwapHistory]: undefined;
};
