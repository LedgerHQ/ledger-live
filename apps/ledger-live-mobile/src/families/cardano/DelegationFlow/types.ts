import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/cardano/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";
import { ScreenName } from "~/const";

export type CardanoDelegationFlowParamList = {
  [ScreenName.CardanoDelegationStarted]: {
    accountId: string;
  };
  [ScreenName.CardanoDelegationSummary]: {
    accountId: string;
    pool?: StakePool;
    transaction?: Transaction;
  };
  [ScreenName.CardanoDelegationPoolSelect]: {
    accountId: string;
    pool?: StakePool;
    transaction?: Transaction;
  };
  [ScreenName.CardanoDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.CardanoDelegationConnectDevice]: {
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
  [ScreenName.CardanoDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.CardanoDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
