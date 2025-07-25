import type { Transaction as EvmTransaction, GasOptions } from "@ledgerhq/coin-evm/types/index";
import {
  ExchangeRate,
  SwapDataType,
  SwapLiveError,
} from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

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
import { Account, Operation } from "@ledgerhq/types-live";
import { NavigatorScreenParams } from "@react-navigation/core";
import BigNumber from "bignumber.js";
import { AssetSelectionNavigatorParamsList } from "LLM/features/AssetSelection/types";
import { NavigatorName, ScreenName } from "~/const";
import type {
  DefaultAccountSwapParamList,
  DetailsSwapParamList,
  SwapOperationDetails,
  SwapPendingOperation,
  SwapSelectCurrency,
} from "../../../screens/Swap/types";

type Target = "from" | "to";

export type SwapNavigatorParamList = {
  [ScreenName.SwapTab]:
    | DetailsSwapParamList
    | DefaultAccountSwapParamList
    | SwapSelectCurrency
    | SwapPendingOperation;
  [ScreenName.SwapSelectAccount]: {
    target: Target;
    provider?: string;
    swap: SwapDataType;
    selectableCurrencyIds: string[];
    selectedCurrency: CryptoCurrency | TokenCurrency;
  };
  [ScreenName.SwapSelectCurrency]: SwapSelectCurrency;
  [ScreenName.SwapSelectProvider]: {
    provider?: string;
    swap: SwapDataType;
    selectedRate: ExchangeRate | undefined;
  };
  [ScreenName.SwapSelectFees]: {
    accountId?: string;
    parentAccountId?: string;
    swap: SwapDataType;
    rate?: ExchangeRate;
    provider?: string;
    transaction?: Transaction | null;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    operation?: Operation;
    currentNavigation:
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
  };
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
  [NavigatorName.AssetSelection]?: Partial<
    NavigatorScreenParams<AssetSelectionNavigatorParamsList>
  >;
  [ScreenName.SwapCustomError]: {
    error?: SwapLiveError | Error;
  };
};
