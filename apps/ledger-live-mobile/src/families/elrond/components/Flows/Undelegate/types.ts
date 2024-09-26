import type BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  MultiversxAccount,
  MultiversxProvider,
  TransactionStatus,
} from "@ledgerhq/live-common/families/elrond/types";
import type { ScreenName } from "~/const";

export type MultiversxUndelegationFlowParamList = {
  [ScreenName.ElrondUndelegationAmount]: {
    amount: BigNumber;
    validator: MultiversxProvider;
    account: MultiversxAccount;
    transaction: Transaction;
  };
  [ScreenName.ElrondUndelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.ElrondUndelegationConnectDevice]: {
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
  [ScreenName.ElrondUndelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.ElrondUndelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
