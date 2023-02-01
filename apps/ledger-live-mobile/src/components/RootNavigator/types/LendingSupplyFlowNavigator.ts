import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import type { Transaction as EthereumTransaction } from "@ledgerhq/live-common/families/ethereum/types";
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
  CryptoOrgAccount,
  Transaction as CryptoOrgTransaction,
} from "@ledgerhq/live-common/families/crypto_org/types";
import {
  SolanaAccount,
  Transaction as SolanaTransaction,
} from "@ledgerhq/live-common/families/solana/types";
import { Transaction as HederaTransaction } from "@ledgerhq/live-common/families/hedera/types";
import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/ripple/types";
import type { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ScreenName } from "../../../const";

export type LendingSupplyFlowNavigatorParamList = {
  [ScreenName.LendingSupplyAmount]: {
    accountId: string;
    parentId?: string;
    currency: TokenCurrency;
  };
  [ScreenName.LendingSupplySummary]: {
    accountId: string;
    parentId?: string;
    deviceId?: string;
    transaction: Transaction;
    currentNavigation:
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
  };
  [ScreenName.LendingSupplySelectDevice]: object;
  [ScreenName.LendingSupplyConnectDevice]: {
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
  [ScreenName.LendingSupplyValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    currency: TokenCurrency;
  };
  [ScreenName.LendingSupplyValidationError]: {
    accountId: string;
    parentId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    currency: TokenCurrency;
  };
  [ScreenName.AlgorandEditMemo]: {
    accountId?: string;
    parentId?: string;
    account: AlgorandAccount;
    transaction: AlgorandTransaction;
    status?: AlgorandTransactionStatus;
    currentNavigation:
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
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
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
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
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.EthereumCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: EthereumTransaction;
    currentNavigation:
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.EthereumEditGasLimit]: {
    accountId: string;
    parentId?: string;
    setGasLimit: (_: BigNumber) => void;
    gasLimit?: BigNumber | null;
    transaction: EthereumTransaction;
    currentNavigation:
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.RippleEditFee]: {
    accountId: string;
    parentId?: string;
    transaction: RippleTransaction;
    currentNavigation:
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.StellarEditCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: StellarTransaction;
    currentNavigation:
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
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
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.CryptoOrgEditMemo]: {
    accountId: string;
    parentId?: string;
    account: CryptoOrgAccount;
    transaction: CryptoOrgTransaction;
    currentNavigation:
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
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
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
  [ScreenName.RippleEditTag]: {
    accountId: string;
    parentId?: string;
    transaction: RippleTransaction;
    currentNavigation:
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
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
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
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
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
};
