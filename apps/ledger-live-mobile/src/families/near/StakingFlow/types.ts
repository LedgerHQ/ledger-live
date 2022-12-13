import BigNumber from "bignumber.js";
import type {
  NearValidatorItem,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/near/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "../../../const";

export type NearStakingFlowParamList = {
  [ScreenName.NearStakingStarted]: {
    accountId: string;
  };
  [ScreenName.NearStakingValidator]: {
    accountId: string;
    validator?: NearValidatorItem;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
  };
  [ScreenName.NearStakingValidatorSelect]: {
    accountId: string;
    transaction?: Transaction;
    validator?: NearValidatorItem;
  };
  [ScreenName.NearStakingAmount]: {
    accountId: string;
    transaction: Transaction;
    max?: BigNumber;
    value?: BigNumber;
    nextScreen: string;
    updateTransaction?: (updater: (arg0: Transaction) => Transaction) => void;
    bridgePending?: boolean;
    status?: TransactionStatus;
    validator: NearValidatorItem;
  };
  [ScreenName.NearStakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.NearStakingConnectDevice]: {
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
  [ScreenName.NearStakingValidationError]: {
    accountId: string;
    error: Error;
  };
  [ScreenName.NearStakingValidationSuccess]: {
    accountId: string;
    result: Operation;
  };
};
