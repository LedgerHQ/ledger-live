import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/osmosis/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  CosmosMappedDelegation,
  CosmosValidatorItem,
} from "@ledgerhq/live-common/families/cosmos/types";
import BigNumber from "bignumber.js";
import { ScreenName } from "../../../const";

export type OsmosisUndelegationFlowParamList = {
  [ScreenName.OsmosisUndelegationAmount]: {
    accountId: string;
    delegation: CosmosMappedDelegation;
    transaction: Transaction;
    status: TransactionStatus;
    validator: CosmosValidatorItem;
    validatorSrc?: CosmosValidatorItem;
    min?: BigNumber;
    max?: BigNumber;
    value?: BigNumber;
    redelegatedBalance?: BigNumber;
    mode?: string;
    nextScreen: ScreenName.OsmosisUndelegationSelectDevice;
  };
  [ScreenName.OsmosisUndelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.OsmosisUndelegationConnectDevice]: {
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
  [ScreenName.OsmosisUndelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.OsmosisUndelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
