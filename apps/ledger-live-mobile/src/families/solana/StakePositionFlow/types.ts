import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/solana/types";
import type { StakePositionExitAction } from "@features/flow-stake-position";
import { ScreenName } from "~/const";

/** What the stake position sheet hands off to the device screens once the user confirms. */
type ExitTransactionParams = {
  accountId: string;
  transaction: Transaction;
  status: TransactionStatus;
  requestId: number;
  action: StakePositionExitAction;
  analyticsPropertyFlow?: string;
};

export type SolanaStakePositionFlowParamList = {
  [ScreenName.SolanaStakePositionSelectDevice]: ExitTransactionParams & {
    forceSelectDevice?: boolean;
  };
  [ScreenName.SolanaStakePositionConnectDevice]: ExitTransactionParams & {
    device: Device;
    appName?: string;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
  };
  [ScreenName.SolanaStakePositionValidationSuccess]: {
    accountId: string;
    requestId: number;
    action: StakePositionExitAction;
    result: Operation;
  };
  [ScreenName.SolanaStakePositionValidationError]: {
    requestId: number;
    error: Error;
  };
};
