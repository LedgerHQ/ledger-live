import type {
  SolanaStakeWithMeta,
  StakeAction,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/solana/types";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import type { ValidatorsAppValidator } from "@ledgerhq/live-common/families/solana/validator-app/index";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

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
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationSummary]: {
    accountId: string;
    parentId?: string;
    delegationAction?: DelegationAction;
    amount?: number;
    validator?: ValidatorsAppValidator;
    transaction: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationSelectValidator]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.SolanaEditAmount]: {
    accountId: string;
    parentId?: string;
    amount?: number;
    transaction: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
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
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationSelectDevice]: {
    device?: Device;
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
    validatorName?: ValidatorsAppValidator["name"];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    validatorName?: ValidatorsAppValidator["name"];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
