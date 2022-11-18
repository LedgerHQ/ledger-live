import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/osmosis/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import BigNumber from "bignumber.js";
import { ScreenName } from "../../../const";

export type OsmosisClaimRewardsFlowParamList = {
  [ScreenName.OsmosisClaimRewardsValidator]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.OsmosisClaimRewardsMethod]: {
    accountId: string;
    transaction?: Transaction;
    validator: CosmosValidatorItem;
    value: BigNumber;
  };
  [ScreenName.OsmosisClaimRewardsSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.OsmosisClaimRewardsConnectDevice]: {
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
  [ScreenName.OsmosisClaimRewardsValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.OsmosisClaimRewardsValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
