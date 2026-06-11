import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { TransactionStatus } from "@ledgerhq/coin-evm/types/index";
import type { StakingMappedUnbonding } from "@ledgerhq/live-common/families/evm/staking/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type EvmWithdrawFlowParamList = {
  [ScreenName.EvmWithdrawConfirmation]: {
    accountId: string;
    parentId?: string | null;
    unbonding: StakingMappedUnbonding;
  };
  [ScreenName.EvmWithdrawSelectDevice]: {
    accountId: string;
    parentId?: string | null;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.EvmWithdrawConnectDevice]: {
    device: Device;
    accountId: string;
    parentId?: string | null;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    forceSelectDevice?: boolean;
  };
  [ScreenName.EvmWithdrawValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.EvmWithdrawValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
