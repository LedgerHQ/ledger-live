import type { Transaction as EvmTransaction, GasOptions } from "@ledgerhq/coin-evm/types/index";
import { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";

import type {
  AlgorandAccount,
  AlgorandTransaction,
  TransactionStatus as AlgorandTransactionStatus,
} from "@ledgerhq/live-common/families/algorand/types";
import type {
  Transaction as BitcoinTransaction,
  TransactionStatus as BitcoinTransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import type {
  CardanoAccount,
  Transaction as CardanoTransaction,
} from "@ledgerhq/live-common/families/cardano/types";
import type { Transaction as CasperTransaction } from "@ledgerhq/live-common/families/casper/types";
import {
  CosmosAccount,
  Transaction as CosmosTransaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { Transaction as HederaTransaction } from "@ledgerhq/live-common/families/hedera/types";
import type { Transaction as ICPTransaction } from "@ledgerhq/live-common/families/internet_computer/types";
import {
  SolanaAccount,
  Transaction as SolanaTransaction,
} from "@ledgerhq/live-common/families/solana/types";
import type { Transaction as MinaTransaction } from "@ledgerhq/live-common/families/mina/types";
import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import type { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import type { Transaction as TonTransaction } from "@ledgerhq/live-common/families/ton/types";
import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/xrp/types";
import type {
  Transaction as KaspaTransaction,
  TransactionStatus as KaspaTransactionStatus,
} from "@ledgerhq/live-common/families/kaspa/types";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ScreenName } from "~/const";
import type {
  DefaultAccountSwapParamList,
  DetailsSwapParamList,
  SwapOperationDetails,
  SwapPendingOperation,
  SwapSelectCurrency,
} from "~/screens/Swap/types";

export type SwapNavigatorParamList = {
  [ScreenName.SwapTab]:
    | DetailsSwapParamList
    | DefaultAccountSwapParamList
    | SwapSelectCurrency
    | SwapPendingOperation;
  [ScreenName.SwapHistory]: undefined;
  [ScreenName.SwapPendingOperation]: SwapPendingOperation;
  [ScreenName.SwapOperationDetails]: {
    swapOperation: SwapOperationDetails;
    fromPendingOperation?: true;
  };
  [ScreenName.AlgorandEditMemo]: {
    accountId?: string;
    parentId?: string;
    account: AlgorandAccount;
    transaction: AlgorandTransaction;
    status?: AlgorandTransactionStatus;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.BitcoinEditCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: BitcoinTransaction;
    status?: BitcoinTransactionStatus;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
    satPerByte?: BigNumber | null;
    setSatPerByte?: (_: BigNumber) => void;
  };
  [ScreenName.CardanoEditMemo]: {
    accountId: string;
    parentId?: string;
    account: CardanoAccount;
    transaction: CardanoTransaction;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.EvmCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: EvmTransaction;
    gasOptions?: GasOptions;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.EvmEditGasLimit]: {
    accountId: string;
    setGasLimit: (_: BigNumber) => void;
    gasLimit?: BigNumber | null;
    transaction: EvmTransaction;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.KaspaEditCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: KaspaTransaction;
    status?: KaspaTransactionStatus;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
    sompiPerByte?: BigNumber | null;
    setSompiPerByte?: (_: BigNumber) => void;
  };
  [ScreenName.StellarEditMemoValue]: {
    accountId: string;
    parentId?: string;
    account: Account;
    transaction: StellarTransaction;
    memoType?: string;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
  };
  [ScreenName.StellarEditCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: StellarTransaction;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.CosmosFamilyEditMemo]: {
    accountId: string;
    parentId?: string;
    account: CosmosAccount;
    transaction: CosmosTransaction;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.HederaEditMemo]: {
    accountId: string;
    parentId?: string;
    account: Account;
    transaction: HederaTransaction;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.XrpEditTag]: {
    accountId: string;
    parentId?: string;
    transaction: RippleTransaction;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.SolanaEditMemo]: {
    accountId: string;
    parentId?: string;
    account: SolanaAccount;
    transaction: SolanaTransaction;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.StellarEditMemoType]: {
    accountId: string;
    parentId?: string;
    account: Account;
    transaction: StellarTransaction;
    memoType?: string;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
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
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SignTransactionSummary;
  };

  [ScreenName.StacksEditMemo]: {
    accountId: string;
    parentId?: string;
    account: Account;
    transaction: StacksTransaction;
    memoType?: string;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.CasperEditTransferId]: {
    accountId: string;
    account: Account;
    parentId?: string;
    transaction: CasperTransaction;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.TonEditComment]: {
    accountId: string;
    account: Account;
    parentId?: string;
    transaction: TonTransaction;
    currentNavigation: ScreenName.SignTransactionSummary | ScreenName.SendSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
  };
  [ScreenName.SwapCustomError]: {
    error?: SwapLiveError | Error;
  };
  [ScreenName.SwapLoading]: undefined;
};
