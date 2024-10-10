import { AnyMessage } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";

export type CommonParams = {
  accountId: string;
  message: AnyMessage;
  appName?: string;
  dependencies?: string[];
  onConfirmationHandler?: (_: string) => void;
  onFailHandler?: (_: Error) => void;
};

export type SignMessageNavigatorStackParamList = {
  [ScreenName.SignSummary]: {
    currentNavigation?: keyof SignMessageNavigatorStackParamList;
    nextNavigation?: keyof SignMessageNavigatorStackParamList;
  } & CommonParams;
  [ScreenName.SignSelectDevice]: { forceSelectDevice?: boolean } & CommonParams;
  [ScreenName.SignConnectDevice]: {
    device?: Device;
    analyticsPropertyFlow?: string;
    transaction: Transaction;
    status?: TransactionStatus;
  } & CommonParams;
  [ScreenName.SignValidationSuccess]: {
    signature?: string;
  } & CommonParams;
  [ScreenName.SignValidationError]: {
    error?: Error;
  } & CommonParams;
};
