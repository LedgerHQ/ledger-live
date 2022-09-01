import { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
import { Device } from "@ledgerhq/types-devices";
import { StackScreenProps } from "@react-navigation/stack";
import { ScreenName } from "../../../const";

export type CommonParams = {
  accountId: string;
  message: MessageData | TypedMessageData;
  onFailHandler?: (_: Error) => void;
  onConfirmationHandler?: (_: string) => void;
};

export type SignMessageNavigatorStackParamList = {
  [ScreenName.SignSummary]: {
    // currentNavigation?: Exclude<
    //   keyof SignMessageNavigatorStackParamList,
    //   ScreenName.SignSelectDevice
    // >;
    // nextNavigation?: Exclude<
    //   keyof SignMessageNavigatorStackParamList,
    //   ScreenName.SignSelectDevice
    // >;
    currentNavigation?: keyof SignMessageNavigatorStackParamList;
    nextNavigation?: keyof SignMessageNavigatorStackParamList;
  } & CommonParams;
  [ScreenName.SignSelectDevice]: {
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
  };
  [ScreenName.SignConnectDevice]: {
    device: Device;
    appName?: string;
  } & CommonParams;
  [ScreenName.SignValidationSuccess]: {
    signature: string;
  } & CommonParams;
  [ScreenName.SignValidationError]: {
    error: Error;
  } & CommonParams;
};

export type SignMessageNavigatorProps<
  T extends keyof SignMessageNavigatorStackParamList = keyof SignMessageNavigatorStackParamList,
> = StackScreenProps<SignMessageNavigatorStackParamList, T>;
