import {
  Account,
  CryptoCurrency,
  TokenAccount,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";

export type SwapProps = MaterialTopTabScreenProps<
  SwapFormNavParamList,
  "SwapForm"
>;

export type SwapNavParamList = {
  Swap: undefined;
  SwapSelectAccount: {
    target: "from" | "to";
    onSelect: (account: Account | TokenAccount) => void;
  };
  SwapSelectCurrency: {
    onSelect: (currency: CryptoCurrency | TokenCurrency) => void;
  };
};

export type SwapFormNavParamList = {
  SwapForm: undefined;
  SwapHistory: undefined;
};
