import {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  Currency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { AccountLike } from "@ledgerhq/types-live";
import type { ScreenName } from "~/const";

export type ReceiveFundsStackParamList = {
  [ScreenName.ReceiveSelectCrypto]:
    | {
        filterCurrencyIds?: string[];
        currency?: string;
      }
    | undefined;
  [ScreenName.DepositSelectNetwork]:
    | {
        filterCurrencyIds?: string[];
        provider: {
          currenciesByNetwork: CryptoOrTokenCurrency[];
          providerId: string;
        };
      }
    | undefined;
  [ScreenName.ReceiveSelectAccount]: {
    currency: CryptoCurrency | TokenCurrency;
    createTokenAccount?: boolean;
  };
  [ScreenName.ReceiveAddAccountSelectDevice]: {
    accountId?: string;
    parentId?: string;
    currency: CryptoCurrency;
    inline?: boolean;
    analyticsPropertyFlow?: string;
    createTokenAccount?: boolean;
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
};
