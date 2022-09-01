import type {
  SolanaStakeWithMeta,
  StakeAction,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/solana/types";
import type { ValidatorsAppValidator } from "@ledgerhq/live-common/families/solana/validator-app/index";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "../../../const";

export type DelegationAction =
  | {
      kind: "new";
    }
  | {
      kind: "change";
      stakeWithMeta: SolanaStakeWithMeta;
      stakeAction: StakeAction;
    };

export type SolanaDelegationFlowParamList = {
  [ScreenName.SolanaDelegationStarted]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.DelegationSummary]: {
    accountId: string;
    parentId?: string;
    delegationAction?: DelegationAction;
    amount?: number;
    validator?: ValidatorsAppValidator;
    transaction: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.DelegationSelectValidator]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.SolanaEditAmount]: {
    accountId: string;
    parentId?: string;
    amount?: number;
    transaction: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.DelegationConnectDevice]: {
    device: Device;
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.DelegationSelectDevice]: {
    device?: Device;
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.DelegationValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.DelegationValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
