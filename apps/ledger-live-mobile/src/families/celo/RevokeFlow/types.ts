import {
  CeloAccount,
  CeloValidatorGroup,
  CeloVote,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/celo/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type CeloRevokeFlowFlowParamList = {
  [ScreenName.CeloRevokeSummary]: {
    validator?: CeloValidatorGroup;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    amount?: TransactionStatus["amount"];
    vote?: CeloVote;
    account?: CeloAccount;
  };
  [ScreenName.CeloRevokeValidatorSelect]: {
    accountId: string;
    transaction?: Transaction;
    validator?: CeloValidatorGroup;
  };
  [ScreenName.CeloRevokeAmount]: {
    accountId: string;
    transaction: Transaction;
    amount?: TransactionStatus["amount"];
    vote?: CeloVote;
  };
  [ScreenName.CeloRevokeSelectDevice]: {
    accountId: string;
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.CeloRevokeConnectDevice]: {
    device: Device;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.CeloRevokeValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.CeloRevokeValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
