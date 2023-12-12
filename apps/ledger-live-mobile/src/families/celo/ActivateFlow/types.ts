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

export type CeloActivateFlowParamList = {
  [ScreenName.CeloActivateSummary]: {
    validator?: CeloValidatorGroup;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    amount?: TransactionStatus["amount"];
    vote?: CeloVote;
    account?: CeloAccount;
  };
  [ScreenName.CeloActivateValidatorSelect]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    validator?: CeloValidatorGroup;
  };
  [ScreenName.CeloActivateSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.CeloActivateConnectDevice]: {
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
  [ScreenName.CeloActivateValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.CeloActivateValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
