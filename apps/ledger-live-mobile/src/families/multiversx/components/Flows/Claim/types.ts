import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  MultiversxAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/multiversx/types";
import type { ScreenName } from "~/const";
import type { DelegationType } from "../../../types";

export type MultiversxClaimRewardsFlowParamList = {
  [ScreenName.MultiversxClaimRewardsValidator]: {
    delegations: DelegationType[];
    account: MultiversxAccount;
  };
  [ScreenName.MultiversxClaimRewardsMethod]: {
    transaction?: Transaction;
    account: MultiversxAccount;
    recipient: string;
    value: string;
    name: string;
  };
  [ScreenName.MultiversxClaimRewardsSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.MultiversxClaimRewardsConnectDevice]: {
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
  [ScreenName.MultiversxClaimRewardsValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.MultiversxClaimRewardsValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
