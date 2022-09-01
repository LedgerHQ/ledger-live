import {
  ExchangeRate,
  MappedSwapOperation,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/types";
import {
  CryptoCurrency,
  Currency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ScreenName } from "../../../const";

type Target = "from" | "to";

type SwapOperation = Omit<MappedSwapOperation, "fromAccount" | "toAccount"> & {
  fromAccountId: string;
  toAccountId: string;
};

export type SwapNavigatorParamList = {
  [ScreenName.SwapTab]: undefined;
  [ScreenName.SwapSelectAccount]: {
    target: Target;
    provider?: string;
    swap: SwapDataType;
    selectableCurrencyIds: string[];
    selectedCurrency: CryptoCurrency | TokenCurrency;
  };
  [ScreenName.SwapSelectCurrency]: {
    currencies: Currency[];
    provider: string;
  };
  [ScreenName.SwapSelectProvider]: {
    provider?: string;
    swap: SwapDataType;
    selectedId?: string;
  };
  [ScreenName.SwapSelectFees]: {
    swap: SwapDataType;
    rate?: ExchangeRate;
    provider?: string;
    transaction?: Transaction | null;
  };
  [ScreenName.SwapLogin]: {
    provider: string;
  };
  [ScreenName.SwapKYC]: {
    provider: string;
  };
  [ScreenName.SwapKYCStates]: {
    onStateSelect: (_: { value: string; label: string }) => void;
  };
  [ScreenName.SwapMFA]: {
    provider: string;
  };
  [ScreenName.SwapPendingOperation]: {
    swapOperation: SwapOperation;
  };
  [ScreenName.SwapOperationDetails]: {
    swapOperation: SwapOperation;
    fromPendingOperation?: true;
  };
};
