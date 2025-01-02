import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  MultiversxAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/elrond/types";
import type { ScreenName } from "~/const";
import type { DelegationType } from "../../../types";

export type MultiversxClaimRewardsFlowParamList = {
  [ScreenName.ElrondClaimRewardsValidator]: {
    delegations: DelegationType[];
    account: MultiversxAccount;
  };
  [ScreenName.ElrondClaimRewardsMethod]: {
    transaction?: Transaction;
    account: MultiversxAccount;
    recipient: string;
    value: string;
    name: string;
  };
  [ScreenName.ElrondClaimRewardsSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.ElrondClaimRewardsConnectDevice]: {
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
  [ScreenName.ElrondClaimRewardsValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.ElrondClaimRewardsValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
