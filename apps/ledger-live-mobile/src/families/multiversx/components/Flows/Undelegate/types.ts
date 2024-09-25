import type BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  MultiversXAccount,
  MultiversXProvider,
  TransactionStatus,
} from "@ledgerhq/live-common/families/multiversx/types";
import type { ScreenName } from "~/const";

export type MultiversXUndelegationFlowParamList = {
  [ScreenName.MultiversXUndelegationAmount]: {
    amount: BigNumber;
    validator: MultiversXProvider;
    account: MultiversXAccount;
    transaction: Transaction;
  };
  [ScreenName.MultiversXUndelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.MultiversXUndelegationConnectDevice]: {
    device: Device;
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    forceSelectDevice?: boolean;
  };
  [ScreenName.MultiversXUndelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.MultiversXUndelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
