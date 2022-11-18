import { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/osmosis/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import BigNumber from "bignumber.js";
import { ScreenName } from "../../../const";

export type OsmosisDelegationFlowParamList = {
  [ScreenName.OsmosisDelegationStarted]: {
    accountId: string;
  };
  [ScreenName.OsmosisDelegationValidator]: {
    accountId: string;
    validator?: CosmosValidatorItem;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
  };
  [ScreenName.OsmosisDelegationValidatorSelect]: {
    accountId: string;
    transaction?: Transaction;
    validator?: CosmosValidatorItem;
  };
  [ScreenName.OsmosisDelegationAmount]: {
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    validator: CosmosValidatorItem;
    validatorSrc?: CosmosValidatorItem;
    min?: BigNumber;
    max?: BigNumber;
    value?: BigNumber;
    redelegatedBalance?: BigNumber;
    mode?: string;
    nextScreen: ScreenName.OsmosisDelegationValidator;
  };
  [ScreenName.OsmosisDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.OsmosisDelegationConnectDevice]: {
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
  [ScreenName.OsmosisDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.OsmosisDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
