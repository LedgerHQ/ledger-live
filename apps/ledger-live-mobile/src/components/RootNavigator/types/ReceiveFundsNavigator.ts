import { Currency } from "@ledgerhq/types-cryptoassets";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { AccountLike } from "@ledgerhq/types-live";
import { NavigatorScreenParams } from "@react-navigation/native";
import type { NavigatorName, ScreenName } from "~/const";
import { DeviceSelectionNavigatorParamsList } from "LLM/features/DeviceSelection/types";

export type ReceiveFundsStackParamList = {
  [ScreenName.ReceiveProvider]: {
    manifestId: string;
    fromMenu?: boolean;
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
    fromMenu?: boolean;
    hideBackButton?: boolean;
  };
  [NavigatorName.DeviceSelection]?: Partial<
    NavigatorScreenParams<DeviceSelectionNavigatorParamsList>
  >;
};
