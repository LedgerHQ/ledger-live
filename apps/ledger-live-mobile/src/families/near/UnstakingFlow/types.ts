import BigNumber from "bignumber.js";
import type {
  NearMappedStakingPosition,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/near/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type NearUnstakingFlowParamList = {
  [ScreenName.NearUnstakingAmount]: {
    accountId: string;
    stakingPosition: NearMappedStakingPosition;
    transaction: Transaction;
    value?: BigNumber;
    max?: BigNumber;
    nextScreen: string;
    updateTransaction?: (updater: (arg0: Transaction) => Transaction) => void;
    bridgePending?: boolean;
    status?: TransactionStatus;
  };
  [ScreenName.NearUnstakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.NearUnstakingConnectDevice]: {
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
  [ScreenName.NearUnstakingValidationError]: {
    accountId: string;
    error: Error;
  };
  [ScreenName.NearUnstakingValidationSuccess]: {
    accountId: string;
    result: Operation;
  };
};
