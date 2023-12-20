import { AnyMessage } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";

export type CommonParams = {
  accountId: string;
  message: AnyMessage;
};

export type SignMessageNavigatorStackParamList = {
  [ScreenName.SignSummary]: {
    currentNavigation?: keyof SignMessageNavigatorStackParamList;
    nextNavigation?: keyof SignMessageNavigatorStackParamList;
    onConfirmationHandler?: (_: string) => void;
    onFailHandler?: (_: Error) => void;
  } & CommonParams;
  [ScreenName.SignSelectDevice]: CommonParams;
  [ScreenName.SignConnectDevice]: {
    device?: Device;
    analyticsPropertyFlow?: string;
    transaction: Transaction;
    status?: TransactionStatus;
    appName?: string;
    onSuccess: (payload: unknown) => void;
    onError: (_: Error) => void;
  } & CommonParams;
  [ScreenName.SignValidationSuccess]: {
    signature?: string;
    onConfirmationHandler?: (_: string) => void;
  } & CommonParams;
  [ScreenName.SignValidationError]: {
    error?: Error;
    onFailHandler?: (_: Error) => void;
  } & CommonParams;
};
