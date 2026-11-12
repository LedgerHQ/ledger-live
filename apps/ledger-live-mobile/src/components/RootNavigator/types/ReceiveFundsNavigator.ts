import {
  Currency,
  CryptoOrTokenCurrency,
  type CryptoOrTokenCurrencyId,
} from "@domain/entity-currency";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { AccountLike } from "@ledgerhq/types-live";
import { NavigatorScreenParams } from "@react-navigation/native";
import type { NavigatorName, ScreenName } from "~/const";
import { DeviceSelectionNavigatorParamsList } from "LLM/features/DeviceSelection/types";

export type ReceiveFundsStackParamList = {
  [ScreenName.ReceiveProvider]: {
    manifestId: string;
    fromMenu?: boolean;
    noahAuth?: "createAccount" | "logIn";
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
  [ScreenName.ReceiveAddress]: {
    accountUUID: AccountUUID;
    /** What the user receives: the account's coin, or a token of its network. */
    assetId: CryptoOrTokenCurrencyId;
    /** Where the screen sends the user when the account cannot receive here yet. */
    legacyParams: ReceiveFundsStackParamList[ScreenName.ReceiveConfirmation];
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
    fromMenu?: boolean;
    hideBackButton?: boolean;
  };
  [NavigatorName.DeviceSelection]?: Partial<
    NavigatorScreenParams<DeviceSelectionNavigatorParamsList>
  >;
};
