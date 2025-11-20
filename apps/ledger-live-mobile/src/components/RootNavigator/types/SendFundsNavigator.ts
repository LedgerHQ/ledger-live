import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation } from "@ledgerhq/types-live";
import { Account, AccountLike } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { GasOptions, Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import type { TransactionBroadcastError } from "@ledgerhq/live-common/errors/transactionBroadcastErrors";
import type {
  CardanoAccount,
  Transaction as CardanoTransaction,
} from "@ledgerhq/live-common/families/cardano/types";
import type {
  CantonAccount,
  Transaction as CantonTransaction,
} from "@ledgerhq/live-common/families/canton/types";
import type {
  Transaction as BitcoinTransaction,
  TransactionStatus as BitcoinTransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import type {
  AlgorandAccount,
  AlgorandTransaction,
  TransactionStatus as AlgorandTransactionStatus,
} from "@ledgerhq/live-common/families/algorand/types";
import {
  CosmosAccount,
  Transaction as CosmosTransaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { Transaction as HederaTransaction } from "@ledgerhq/live-common/families/hedera/types";
import {
  SolanaAccount,
  Transaction as SolanaTransaction,
} from "@ledgerhq/live-common/families/solana/types";
import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/xrp/types";
import type { Transaction as ICPTransaction } from "@ledgerhq/live-common/families/internet_computer/types";
import type { Transaction as MinaTransaction } from "@ledgerhq/live-common/families/mina/types";
import type { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import type { Transaction as CasperTransaction } from "@ledgerhq/live-common/families/casper/types";
import type { Transaction as TonTransaction } from "@ledgerhq/live-common/families/ton/types";
import type {
  Transaction as KaspaTransaction,
  TransactionStatus as KaspaTransactionStatus,
} from "@ledgerhq/live-common/families/kaspa/types";
import BigNumber from "bignumber.js";
import { Result } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { ScreenName } from "~/const";

export type SendFundsNavigatorStackParamList = {
  [ScreenName.SendCoin]:
    | {
        currency?: string;
        selectedCurrency?: CryptoCurrency | TokenCurrency;
        next?: string;
        category?: string;
        notEmptyAccounts?: boolean;
        minBalance?: number;
      }
    | undefined;
  [ScreenName.SendSelectRecipient]: {
    accountId?: string;
    parentId?: string;
    transaction?: Transaction;
    justScanned?: boolean;
  };
  [ScreenName.SendAmountCoin]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
  };
  [ScreenName.SendSummary]: {
    accountId: string;
    parentId?: string;
    deviceId?: string;
    transaction: Transaction;
    hideTotal?: boolean;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
    overrideAmountLabel?: string;
    operation?: Operation;
    appName?: string;
  };
  [ScreenName.SendSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
  };
  [ScreenName.SendConnectDevice]: {
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
  [ScreenName.SendValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.SendBroadcastError]:
    | undefined
    | {
        error: TransactionBroadcastError;
        account?: AccountLike;
        accountId?: string;
        parentId?: string;
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
    accountId?: string;
    parentId?: string;
    account: AlgorandAccount;
    transaction: AlgorandTransaction;
    status?: AlgorandTransactionStatus;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.BitcoinEditCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: BitcoinTransaction;
    status?: BitcoinTransactionStatus;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
    satPerByte?: BigNumber | null;
    setSatPerByte?: (_: BigNumber) => void;
  };
  [ScreenName.CardanoEditMemo]: {
    accountId: string;
    parentId?: string;
    account: CardanoAccount;
    transaction: CardanoTransaction;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.CantonEditMemo]: {
    accountId: string;
    parentId?: string;
    account: CantonAccount;
    transaction: CantonTransaction;
    currentNavigation: ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.EvmCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: EvmTransaction;
    setTransaction: Result<EvmTransaction>["setTransaction"];
    gasOptions?: GasOptions;
    setCustomStrategyTransactionPatch: React.Dispatch<
      React.SetStateAction<Partial<EvmTransaction> | undefined>
    >;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.EvmEditGasLimit]: {
    accountId: string;
    setGasLimit: (_: BigNumber) => void;
    gasLimit?: BigNumber | null;
    transaction: EvmTransaction;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.KaspaEditCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: KaspaTransaction;
    status?: KaspaTransactionStatus;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
    sompiPerByte?: BigNumber | null;
    setSompiPerByte?: (_: BigNumber) => void;
  };
  [ScreenName.StellarEditCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: StellarTransaction;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.CosmosFamilyEditMemo]: {
    accountId: string;
    parentId?: string;
    account: CosmosAccount;
    transaction: CosmosTransaction;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.HederaEditMemo]: {
    accountId: string;
    parentId?: string;
    account: Account;
    transaction: HederaTransaction;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.XrpEditTag]: {
    accountId: string;
    parentId?: string;
    transaction: RippleTransaction;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.SolanaEditMemo]: {
    accountId: string;
    parentId?: string;
    account: SolanaAccount;
    transaction: SolanaTransaction;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.StellarEditMemoValue]: {
    accountId: string;
    parentId?: string;
    account: Account;
    transaction: StellarTransaction;
    memoType?: string;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
  };
  [ScreenName.StellarEditMemoType]: {
    accountId: string;
    parentId?: string;
    account: Account;
    transaction: StellarTransaction;
    memoType?: string;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.InternetComputerEditMemo]: {
    accountId: string;
    account: Account;
    parentId?: string;
    transaction: ICPTransaction;
    currentNavigation: ScreenName.SignTransactionSummary;
  };
  [ScreenName.MinaEditMemo]: {
    accountId: string;
    account: Account;
    parentId?: string;
    transaction: MinaTransaction;
    currentNavigation: ScreenName.SignTransactionSummary;
  };
  [ScreenName.MinaEditMemo]: {
    accountId: string;
    account: Account;
    parentId?: string;
    transaction: MinaTransaction;
    currentNavigation: ScreenName.SignTransactionSummary;
  };
  [ScreenName.StacksEditMemo]: {
    accountId: string;
    parentId?: string;
    account: Account;
    transaction: StacksTransaction;
    memoType?: string;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.CasperEditTransferId]: {
    accountId: string;
    account: Account;
    parentId?: string;
    transaction: CasperTransaction;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.TonEditComment]: {
    accountId: string;
    account: Account;
    parentId?: string;
    transaction: TonTransaction;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
};
