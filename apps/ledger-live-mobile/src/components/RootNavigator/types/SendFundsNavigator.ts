import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, ProtoNFT } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import type {
  AlgorandAccount,
  AlgorandTransaction,
} from "@ledgerhq/live-common/families/algorand/types";
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
    accountId?: string;
    parentId?: string;
    transaction?: Transaction;
    justScanned?: boolean;
  };
  [ScreenName.SendAmountCoin]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.SendAmountNft]: { accountId: string; transaction: Transaction };
  [ScreenName.SendSummary]: {
    accountId: string;
    deviceId?: string;
    transaction: Transaction;
    currentNavigation?: string;
    nextNavigation?: string;
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
  [ScreenName.SendValidationError]:
    | undefined
    | {
        error?: Error;
        account?: AccountLike;
        accountId?: string;
        parentId?: string;
      };

  [ScreenName.AlgorandEditMemo]: {
    account: AlgorandAccount;
    transaction: AlgorandTransaction;
  };
};
