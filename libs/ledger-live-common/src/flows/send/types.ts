import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction, TransactionStatus } from "../../generated/types";
import type { FlowStatus, FlowStatusActions, FlowStepConfig, FlowConfig } from "../wizard/types";

export const SEND_FLOW_STEP = {
  RECIPIENT: "RECIPIENT",
  AMOUNT: "AMOUNT",
  SIGNATURE: "SIGNATURE",
  CONFIRMATION: "CONFIRMATION",
} as const;

export type SendFlowStep = (typeof SEND_FLOW_STEP)[keyof typeof SEND_FLOW_STEP];

export type BaseSendStepConfig = FlowStepConfig<SendFlowStep> &
  Readonly<{
    addressInput?: boolean;
    showTitle?: boolean;
    height?: "fixed" | "hug";
  }>;

export type BaseSendFlowConfig = FlowConfig<SendFlowStep, BaseSendStepConfig>;

export type SendFlowUiConfig = Readonly<{
  hasMemo: boolean;
  memoType?: string;
  memoMaxLength?: number;
  memoMaxValue?: number;
  memoOptions?: readonly string[];
  recipientSupportsDomain: boolean;
  hasFeePresets: boolean;
  hasCustomFees: boolean;
  hasCoinControl: boolean;
}>;

export type RecipientData = Readonly<{
  address: string;
  ensName?: string;
  memo?: string;
  destinationTag?: string;
}>;

export type SendFlowTransactionState = Readonly<{
  transaction: Transaction | null;
  status: TransactionStatus;
  bridgeError: Error | null;
  bridgePending: boolean;
}>;

export type SendFlowAccountState = Readonly<{
  account: AccountLike | null;
  parentAccount: Account | null;
  currency: CryptoOrTokenCurrency | null;
}>;

export type SendFlowOperationResult = Readonly<{
  optimisticOperation: Operation | null;
  transactionError: Error | null;
  signed: boolean;
}>;

export type SendFlowState = Readonly<{
  account: SendFlowAccountState;
  transaction: SendFlowTransactionState;
  recipient: RecipientData | null;
  operation: SendFlowOperationResult;
  isLoading: boolean;
  flowStatus: FlowStatus;
}>;

export type SendFlowTransactionActions = Readonly<{
  setTransaction: (tx: Transaction) => void;
  updateTransaction: (updater: (tx: Transaction) => Transaction) => void;
  setRecipient: (recipient: RecipientData) => void;
  setAccount: (account: AccountLike, parentAccount?: Account | null) => void;
}>;

export type SendFlowOperationActions = Readonly<{
  onOperationBroadcasted: (operation: Operation) => void;
  onTransactionError: (error: Error) => void;
  onSigned: () => void;
  onRetry: () => void;
}>;

export type SendFlowInitParams = Readonly<{
  account?: AccountLike;
  parentAccount?: Account;
  recipient?: string;
  amount?: string;
  memo?: string;
  fromMAD?: boolean;
}>;

export type SendFlowBusinessContext = Readonly<{
  state: SendFlowState;
  transaction: SendFlowTransactionActions;
  operation: SendFlowOperationActions;
  status: FlowStatusActions;
  uiConfig: SendFlowUiConfig;
  recipientSearch: Readonly<{
    value: string;
    setValue: (value: string) => void;
    clear: () => void;
  }>;
  close: () => void;
  setAccountAndNavigate: (account: AccountLike, parentAccount?: Account) => void;
}>;

export type RecentAddress = Readonly<{
  address: string;
  currency: CryptoOrTokenCurrency;
  lastUsedAt: Date;
  name?: string;
  ensName?: string;
  isLedgerAccount?: boolean;
  accountId?: string;
}>;

export type AddressValidationStatus =
  | "idle"
  | "loading"
  | "valid"
  | "invalid"
  | "sanctioned"
  | "ens_resolved";

export type AddressValidationError =
  | "incorrect_format"
  | "sanctioned"
  | "incompatible_asset"
  | "wallet_not_exist"
  | null;

export type MatchedAccount = Readonly<{
  account: Account;
  accountName: string | undefined;
  accountBalance: string | undefined;
  accountBalanceFormatted: string | undefined;
}>;

export type BridgeValidationErrors = {
  recipient?: Error;
  sender?: Error;
};

export type BridgeValidationWarnings = Record<string, Error>;

export type AddressSearchResult = Readonly<{
  status: AddressValidationStatus;
  error: AddressValidationError;
  resolvedAddress: string | undefined;
  ensName: string | undefined;
  isLedgerAccount: boolean;
  accountName: string | undefined;
  accountBalance: string | undefined;
  accountBalanceFormatted: string | undefined;
  isFirstInteraction: boolean;
  matchedRecentAddress: RecentAddress | undefined;
  matchedAccounts: MatchedAccount[];
  bridgeErrors: BridgeValidationErrors | undefined;
  bridgeWarnings: BridgeValidationWarnings | undefined;
}>;
