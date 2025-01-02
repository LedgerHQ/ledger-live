import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Transaction as EvmTransaction, GasOptions } from "@ledgerhq/coin-evm/types/index";
import type {
  CardanoAccount,
  Transaction as CardanoTransaction,
} from "@ledgerhq/live-common/families/cardano/types";
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
import {
  SolanaAccount,
  Transaction as SolanaTransaction,
} from "@ledgerhq/live-common/families/solana/types";
import { Transaction as HederaTransaction } from "@ledgerhq/live-common/families/hedera/types";
import type { Transaction as ICPTransaction } from "@ledgerhq/live-common/families/internet_computer/types";
import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/xrp/types";
import type { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import type { Transaction as CasperTransaction } from "@ledgerhq/live-common/families/casper/types";
import type { Transaction as TonTransaction } from "@ledgerhq/live-common/families/ton/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ScreenName } from "~/const";

type SharedParams = {
  onSuccess: (signedOperation: SignedOperation) => void;
  onError: (err: Error) => void;
};

export type SignTransactionNavigatorParamList = {
  [ScreenName.SignTransactionSummary]: {
    accountId: string;
    parentId?: string;
    deviceId?: string;
    transaction?: Transaction;
    operation?: Operation;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
    dependencies?: string[];
    isACRE?: boolean;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  } & SharedParams;
  [ScreenName.SignTransactionSelectDevice]: {
    forceSelectDevice?: boolean;
  } & SharedParams;
  [ScreenName.SignTransactionConnectDevice]: {
    device: Device;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    dependencies?: string[];
    isACRE?: boolean;
    analyticsPropertyFlow?: string;
  } & SharedParams;
  [ScreenName.SignTransactionValidationError]: {
    error?: Error;
  } & SharedParams;

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
  [ScreenName.EvmCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: EvmTransaction;
    gasOptions?: GasOptions;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
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
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.XrpEditFee]: {
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
  [ScreenName.StacksEditMemo]: {
    accountId: string;
    parentId?: string;
    transaction: StacksTransaction;
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
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
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
