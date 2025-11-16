import BigNumber from "bignumber.js";
import type {
  MappedStake,
  SuiValidator,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/sui/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type SuiUnstakingFlowParamList = {
  [ScreenName.SuiUnstakingAmount]: {
    accountId: string;
    stakingPosition: MappedStake;
    transaction: Transaction;
    value?: BigNumber;
    max?: BigNumber;
    nextScreen: string;
    updateTransaction?: (updater: (arg0: Transaction) => Transaction) => void;
    bridgePending?: boolean;
    status?: TransactionStatus;
    validator?: SuiValidator;
  };
  [ScreenName.SuiUnstakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.SuiUnstakingConnectDevice]: {
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
  [ScreenName.SuiUnstakingValidationError]: {
    accountId: string;
    error: Error;
  };
  [ScreenName.SuiUnstakingValidationSuccess]: {
    accountId: string;
    result: Operation;
  };
};
