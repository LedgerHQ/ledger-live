import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  MultiversXAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/multiversx/types";
import type { ScreenName } from "~/const";
import type { DelegationType } from "../../../types";

export type MultiversXClaimRewardsFlowParamList = {
  [ScreenName.MultiversXClaimRewardsValidator]: {
    delegations: DelegationType[];
    account: MultiversXAccount;
  };
  [ScreenName.MultiversXClaimRewardsMethod]: {
    transaction?: Transaction;
    account: MultiversXAccount;
    recipient: string;
    value: string;
    name: string;
  };
  [ScreenName.MultiversXClaimRewardsSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.MultiversXClaimRewardsConnectDevice]: {
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
  [ScreenName.MultiversXClaimRewardsValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.MultiversXClaimRewardsValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
