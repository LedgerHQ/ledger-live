import { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/osmosis/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import BigNumber from "bignumber.js";
import { ScreenName } from "../../../const";

export type OsmosisRedelegationFlowParamList = {
  [ScreenName.OsmosisRedelegationValidator]: {
    accountId: string;
    validatorSrcAddress: string;
    transaction: Transaction;
  };
  [ScreenName.OsmosisRedelegationAmount]: {
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
    nextScreen: ScreenName.OsmosisRedelegationSelectDevice;
  };
  [ScreenName.OsmosisRedelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.OsmosisRedelegationConnectDevice]: {
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
  [ScreenName.OsmosisRedelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.OsmosisRedelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
