import { AvalanchePChainValidator } from "@ledgerhq/live-common/families/avalanchepchain/types";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/avalanchepchain/types";
import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Device } from "@ledgerhq/types-devices";
import { ScreenName } from "../../../const";

export type AvalancheDelegationFlowParamList = {
  [ScreenName.AvalancheDelegationStarted]: {
    accountId: string;
    validator: AvalanchePChainValidator;
    transaction?: Transaction;
    amount?: BigNumber;
    endTime?: BigNumber;
  };
  [ScreenName.AvalancheDelegationValidator]: {
    accountId: string;
    validator: AvalanchePChainValidator;
    transaction?: Transaction;
    amount?: BigNumber;
    endTime?: BigNumber | null;
  };
  [ScreenName.AvalancheDelegationAmount]: {
    accountId: string;
    transaction: Transaction;
    amount?: BigNumber;
    validator: AvalanchePChainValidator;
  };
  [ScreenName.AvalancheDelegationValidatorSelect]: {
    accountId: string;
    validator?: AvalanchePChainValidator;
  };
  [ScreenName.AvalancheDelegationEndDate]: {
    accountId: string;
    transaction: Transaction;
    amount?: BigNumber;
    validator: AvalanchePChainValidator;
  };
  [ScreenName.AvalancheDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.AvalancheDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.AvalancheDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.AvalancheDelegationConnectDevice]: {
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
};
