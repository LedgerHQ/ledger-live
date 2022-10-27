import type { Operation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  ElrondAccount,
  ElrondProvider,
  TransactionStatus,
} from "@ledgerhq/live-common/families/elrond/types";
import type { ScreenName } from "../../../../../const";

export type ElrondDelegationFlowParamList = {
  [ScreenName.ElrondDelegationStarted]: {
    validators: ElrondProvider[];
    account: ElrondAccount;
  };
  [ScreenName.ElrondDelegationValidator]: {
    validators: ElrondProvider[];
    account: ElrondAccount;
    transaction?: Transaction;
  };
  [ScreenName.ElrondDelegationValidatorList]: {
    transaction: Transaction | null | undefined;
    validators: ElrondProvider[];
    account: ElrondAccount;
  };
  [ScreenName.ElrondDelegationAmount]: {
    transaction: Transaction;
    validators: ElrondProvider[];
    account: ElrondAccount;
    validatorName: string;
  };
  [ScreenName.ElrondDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null | undefined;
    status?: TransactionStatus;
  };
  [ScreenName.ElrondDelegationConnectDevice]: {
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
  [ScreenName.ElrondDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.ElrondDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
