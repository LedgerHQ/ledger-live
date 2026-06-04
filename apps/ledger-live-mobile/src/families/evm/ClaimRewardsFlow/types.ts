import type { StakingValidatorItem } from "@ledgerhq/live-common/families/evm/staking/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { TransactionStatus } from "@ledgerhq/coin-evm/types/index";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import BigNumber from "bignumber.js";
import { ScreenName } from "~/const";

export type EvmClaimRewardsFlowParamList = {
  [ScreenName.EvmClaimRewardsValidator]: {
    accountId: string;
  };
  [ScreenName.EvmClaimRewardsClaim]: {
    accountId: string;
    parentId?: string | null;
    validator: StakingValidatorItem;
    value: BigNumber;
  };
  [ScreenName.EvmClaimRewardsSelectDevice]: {
    accountId: string;
    parentId?: string | null;
    transaction: Transaction;
    status: TransactionStatus;
    validator?: StakingValidatorItem;
    value?: BigNumber;
  };
  [ScreenName.EvmClaimRewardsConnectDevice]: {
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
  [ScreenName.EvmClaimRewardsValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.EvmClaimRewardsValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
