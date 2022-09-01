import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/polkadot/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type PolkadotNominateFlowParamList = {
  [ScreenName.PolkadotNominateSelectValidators]: {
    accountId: string;
    transaction: Transaction;
    fromSelectAmount?: true;
  };
  [ScreenName.PolkadotNominateSelectDevice]: {
    accountId: string;
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.PolkadotNominateConnectDevice]: {
    device: Device;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.PolkadotNominateValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.PolkadotNominateValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
