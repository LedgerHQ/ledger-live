import { ParamListBase, RouteProp } from "@react-navigation/native";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/polkadot/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type PolkadotNominateFlowParamList = {
  [ScreenName.PolkadotNominateSelectValidators]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    fromSelectAmount?: true;
  };
  [ScreenName.PolkadotNominateSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.PolkadotNominateConnectDevice]: {
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
  [ScreenName.PolkadotNominateValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.PolkadotNominateValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
