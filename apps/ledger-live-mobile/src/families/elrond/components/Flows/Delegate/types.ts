import type { Operation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  ElrondAccount,
  ElrondProvider,
  TransactionStatus,
} from "@ledgerhq/live-common/families/elrond/types";
import type { ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/native";

export type ElrondDelegationFlowParamList = {
  [ScreenName.ElrondDelegationStarted]: {
    validators: ElrondProvider[];
    account: ElrondAccount;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.ElrondDelegationValidator]: {
    validators: ElrondProvider[];
    account: ElrondAccount;
    transaction?: Transaction;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.ElrondDelegationValidatorList]: {
    transaction: Transaction | null | undefined;
    validators: ElrondProvider[];
    account: ElrondAccount;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.ElrondDelegationAmount]: {
    transaction: Transaction;
    validators: ElrondProvider[];
    account: ElrondAccount;
    validatorName: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.ElrondDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null | undefined;
    status?: TransactionStatus;
    validators: ElrondProvider[];
    source?: RouteProp<ParamListBase, ScreenName>;
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
    validators: ElrondProvider[];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.ElrondDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.ElrondDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    validators: ElrondProvider[];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
