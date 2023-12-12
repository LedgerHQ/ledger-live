import {
  CeloAccount,
  CeloValidatorGroup,
  CeloVote,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/celo/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type CeloVoteFlowParamList = {
  [ScreenName.CeloVoteStarted]: {
    accountId: string;
  };
  [ScreenName.CeloVoteSummary]: {
    accountId: string;
    validator?: CeloValidatorGroup;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    amount?: TransactionStatus["amount"];
    vote?: CeloVote;
    account?: CeloAccount;
  };
  [ScreenName.CeloVoteValidatorSelect]: {
    accountId: string;
    validator?: CeloValidatorGroup;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    amount?: TransactionStatus["amount"];
  };
  [ScreenName.CeloVoteAmount]: {
    accountId: string;
    validator?: CeloValidatorGroup;
    transaction: Transaction;
    amount?: TransactionStatus["amount"];
  };
  [ScreenName.CeloVoteConnectDevice]: {
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
  [ScreenName.CeloVoteSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.CeloVoteValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.CeloVoteValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
