import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/cardano/types";
import type { Operation } from "@ledgerhq/types-live";
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DRep } from "@ledgerhq/live-common/families/cardano/DRep";
import { ScreenName } from "~/const";

export type CardanoVoteDelegationFlowParamList = {
  [ScreenName.CardanoVoteDelegationStarted]: {
    accountId: string;
    source?: any;
    skipStartedStep?: boolean;
    parentId?: string;
    transaction?: Transaction;
  };
  [ScreenName.CardanoVoteDelegationSummary]: {
    accountId: string;
    drep?: DRep;
    transaction?: Transaction;
    skipStartedStep?: boolean;
    source?: any;
    parentId?: string;
    option?: "DRep" | "noConfidence" | "abstain";
  };
  [ScreenName.CardanoVoteDelegationSelectDRep]: {
    accountId: string;
    drep?: DRep;
    transaction?: Transaction;
    source?: any;
    parentId?: string;
    skipStartedStep?: boolean;
  };
  [ScreenName.CardanoVoteDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.CardanoVoteDelegationConnectDevice]: {
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
  [ScreenName.CardanoVoteDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.CardanoVoteDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
