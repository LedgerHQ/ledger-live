import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { TransactionStatus } from "@ledgerhq/coin-evm/types/index";
import type {
  StakingMappedDelegation,
  StakingValidatorItem,
} from "@ledgerhq/live-common/families/evm/staking/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

type AccountRouteParams = {
  accountId: string;
  parentId?: string | null;
};

export type EvmUndelegationFlowParamList = {
  [ScreenName.EvmUndelegationAmount]: AccountRouteParams & {
    delegation: StakingMappedDelegation;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.EvmUndelegationSelectDevice]: AccountRouteParams & {
    transaction: Transaction;
    status: TransactionStatus;
    validatorName?: StakingValidatorItem["name"];
  };
  [ScreenName.EvmUndelegationConnectDevice]: AccountRouteParams & {
    device: Device;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    forceSelectDevice?: boolean;
    validatorName?: StakingValidatorItem["name"];
  };
  [ScreenName.EvmUndelegationValidationError]: AccountRouteParams & {
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.EvmUndelegationValidationSuccess]: AccountRouteParams & {
    transaction: Transaction;
    result: Operation;
    validatorName?: StakingValidatorItem["name"];
  };
};
