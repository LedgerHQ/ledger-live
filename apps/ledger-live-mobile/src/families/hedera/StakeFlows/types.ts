import {
  HederaAccount,
  StakeType,
  Transaction,
} from "@ledgerhq/live-common/families/hedera/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const/navigation";

export type Node = {
  data: number;
  label: string;
  value: number;
};

export type NodeList = Node[];

export type HederaStakeFlowParamList = {
  [ScreenName.HederaStakeInfo]: {
    account: HederaAccount;
    transaction: Transaction;
    stakeType: StakeType;
  };
  [ScreenName.HederaStakeNodeList]: {
    nodeList: NodeList;
    onChange: (node: Node) => void;
  };
  [ScreenName.HederaStakeSummary]: {
    account: HederaAccount;
    transaction: Transaction;
  };
  // [ScreenName.HederaStakeSelectDevice]: {
  //   accountId: string;
  //   parentId?: string;
  //   transaction?: Transaction | null;
  //   status?: TransactionStatus;
  // };
  [ScreenName.HederaStakeSelectDevice]: {
    account: HederaAccount;
    transaction: Transaction;
  };
  [ScreenName.HederaStakeConnectDevice]: {
    device: Device;
    account: HederaAccount;
    transaction: Transaction;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    forceSelectDevice?: boolean;
  };
  [ScreenName.HederaStakeValidationError]: {
    account: HederaAccount;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.HederaStakeValidationSuccess]: {
    account: HederaAccount;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.HederaStakeStopConfirmation]: {
    account: HederaAccount;
    stakeType: StakeType;
  };
};
