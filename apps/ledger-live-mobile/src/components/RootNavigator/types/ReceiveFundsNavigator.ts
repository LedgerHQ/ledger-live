import {
  CryptoCurrency,
  Currency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { AccountLike } from "@ledgerhq/types-live";
import type { StackScreenProps } from "@react-navigation/stack";
import type { ScreenName } from "../../../const";

export type ReceiveFundsStackParamList = {
  [ScreenName.ReceiveSelectCrypto]: { filterCurrencyIds?: string[] };
  [ScreenName.ReceiveSelectAccount]: {
    currency: CryptoCurrency | TokenCurrency;
  };
  [ScreenName.ReceiveAddAccountSelectDevice]: {
    currency: CryptoCurrency;
    inline?: boolean;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.ReceiveAddAccount]: {
    currency: CryptoCurrency | TokenCurrency;
    device: Device;
    onSuccess?: (_?: unknown) => void;
  };
  [ScreenName.ReceiveConnectDevice]: {
    account?: AccountLike;
    accountId: string;
    parentId?: string;
    notSkippable?: boolean;
    title?: string;
    appName?: string;
    onSuccess?: () => void;
    onError?: () => void;
  };
  [ScreenName.ReceiveVerifyAddress]: {
    account?: AccountLike;
    accountId: string;
    parentId?: string;
    modelId: DeviceModelId;
    wired: boolean;
    device?: Device;
    currency?: Currency;
    createTokenAccount?: boolean;
    onSuccess?: (address?: string) => void;
    onError?: () => void;
  };
  [ScreenName.ReceiveConfirmation]: {
    account?: AccountLike;
    accountId: string;
    parentId?: string;
    modelId?: DeviceModelId;
    verified?: boolean;
    wired?: boolean;
    device?: Device;
    currency?: Currency;
    createTokenAccount?: boolean;
    onSuccess?: (_?: string) => void;
    onError?: () => void;
  };
  [ScreenName.ReceiveVerificationConfirmation]: {
    account?: AccountLike;
    accountId: string;
    parentId?: string;
    modelId?: DeviceModelId;
    verified?: boolean;
    wired?: boolean;
    device?: Device;
    currency?: Currency;
    createTokenAccount?: boolean;
    onSuccess?: (_?: string) => void;
    onError?: () => void;
  };
};

export type ReceiveFundsStackScreenProps<
  T extends keyof ReceiveFundsStackParamList = keyof ReceiveFundsStackParamList,
> = StackScreenProps<ReceiveFundsStackParamList, T>;
