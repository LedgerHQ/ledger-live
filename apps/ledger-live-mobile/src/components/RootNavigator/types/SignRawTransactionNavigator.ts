import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SignedOperation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

type SharedParams = {
  accountId: string;
  transaction: string;
  parentId?: string;
  broadcast?: boolean;
  appName?: string;
  dependencies?: string[];
  onSuccess: (signedOperation: SignedOperation) => void;
  onError: (err: Error) => void;
};

export type SignRawTransactionNavigatorParamList = {
  [ScreenName.SignRawTransactionSelectDevice]: {
    forceSelectDevice?: boolean;
  } & SharedParams;
  [ScreenName.SignRawTransactionConnectDevice]: {
    device: Device;
  } & SharedParams;
  [ScreenName.SignRawTransactionValidationError]: {
    error?: Error;
  } & SharedParams;
};
