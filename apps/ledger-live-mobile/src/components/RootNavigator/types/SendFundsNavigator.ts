import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import type { StackScreenProps } from "@react-navigation/stack";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import { ScreenName } from "../../../const";

export type SendFundsNavigatorStackParamList = {
  [ScreenName.SendCoin]: {
    currency?: string;
    selectedCurrency?: CryptoCurrency | TokenCurrency;
    next: string;
    category: string;
    notEmptyAccounts?: boolean;
    minBalance?: number;
  };
  [ScreenName.SendCollection]: { account: Account };
  [ScreenName.SendNft]: { account: Account; collection: ProtoNFT[] };
  [ScreenName.SendSelectRecipient]: {
    accountId: string;
    parentId: string;
    transaction: Transaction;
    justScanned?: boolean;
  };
  [ScreenName.SendAmountCoin]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.SendAmountNft]: { accountId: string; transaction: Transaction };
  [ScreenName.SendSummary]: {
    accountId: string;
    transaction: Transaction;
    currentNavigation?: keyof SendFundsNavigatorStackParamList;
    nextNavigation?: keyof SendFundsNavigatorStackParamList;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
  };
  [ScreenName.SendSelectDevice]: {
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
  };
  [ScreenName.SendConnectDevice]: {
    device: Device;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.SendValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.SendValidationError]: {
    accountId: string;
    parentId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};

export type SendFundsNavigatorProp<
  T extends keyof SendFundsNavigatorStackParamList,
> = StackScreenProps<SendFundsNavigatorStackParamList, T>;
