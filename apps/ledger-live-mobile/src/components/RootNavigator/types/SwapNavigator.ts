import { AvailableProvider } from "@ledgerhq/live-common/exchange/swap/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { NavigatorScreenParams } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import { SwapFormNavigatorParamList } from "./SwapFormNavigator";

export type SwapNavigatorParamList = {
  [ScreenName.Swap]:
    | {
        defaultAccount?: AccountLike;
        defaultParentAccount?: Account;
      }
    | undefined;
  [ScreenName.SwapFormOrHistory]: NavigatorScreenParams<SwapFormNavigatorParamList> & {
    defaultAccount?: AccountLike;
    defaultParentAccount?: Account;
    providers: AvailableProvider[];
    provider: string;
  };
  [ScreenName.SwapKYC]: undefined;
  [ScreenName.SwapKYCStates]: {
    onStateSelect: (_: { value: string; label: string }) => void;
  };
  [ScreenName.SwapError]: {
    error: Error;
  };
  [ScreenName.SwapPendingOperation]: {
    swapId: string;
    provider: AvailableProvider;
    targetCurrency: Currency;
    operation: Operation;
    fromAccount: Account;
  };
  [ScreenName.SwapForm]: undefined;
  [ScreenName.SwapHistory]: undefined;
};
