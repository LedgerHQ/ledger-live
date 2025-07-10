import BigNumber from "bignumber.js";
import type {
  AptosMappedStakingPosition,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/aptos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type AptosWithdrawingFlowParamList = {
  [ScreenName.AptosWithdrawingAmount]: {
    accountId: string;
    stakingPosition: AptosMappedStakingPosition;
    transaction: Transaction;
    value?: BigNumber;
    max?: BigNumber;
    nextScreen: string;
    updateTransaction?: (updater: (arg0: Transaction) => Transaction) => void;
    bridgePending?: boolean;
    status?: TransactionStatus;
  };
  [ScreenName.AptosWithdrawingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.AptosWithdrawingConnectDevice]: {
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
  [ScreenName.AptosWithdrawingValidationError]: {
    accountId: string;
    error: Error;
  };
  [ScreenName.AptosWithdrawingValidationSuccess]: {
    accountId: string;
    result: Operation;
  };
};
