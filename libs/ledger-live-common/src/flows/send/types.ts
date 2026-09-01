import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Transaction, TransactionStatus } from "../../coin-modules/transaction-types";
import type { FlowStatus, FlowStatusActions, FlowStepConfig, FlowConfig } from "../wizard/types";

export const SEND_FLOW_STEP = {
  RECIPIENT: "RECIPIENT",
  SKIP_MEMO_CONFIRMATION: "SKIP_MEMO_CONFIRMATION",
  RECENT_HISTORY: "RECENT_HISTORY",
  ADD_CONTACT: "ADD_CONTACT",
  ADD_NEW_CONTACT: "ADD_NEW_CONTACT",
  ADD_TO_EXISTING_CONTACT: "ADD_TO_EXISTING_CONTACT",
  AMOUNT: "AMOUNT",
  CUSTOM_FEES: "CUSTOM_FEES",
  COIN_CONTROL: "COIN_CONTROL",
  SIGNATURE: "SIGNATURE",
  CONFIRMATION: "CONFIRMATION",
} as const;

export type SendFlowStep = (typeof SEND_FLOW_STEP)[keyof typeof SEND_FLOW_STEP];

export type BaseSendStepConfig = FlowStepConfig<SendFlowStep> &
  Readonly<{
    addressInput?: boolean;
    showTitle?: boolean;
    height?: "fixed" | "fit";
  }>;

export type BaseSendFlowConfig = FlowConfig<SendFlowStep, BaseSendStepConfig>;

export type SendFlowUiConfig = Readonly<{
  /** Whether the currency supports memos. */
  hasMemo: boolean;
  memoType?: string;
  memoMaxLength?: number;
  memoMaxValue?: number | bigint;
  memoOptions?: readonly string[];
  recipientSupportsDomain: boolean;
  hasFeePresets: boolean;
  hasCustomFees: boolean;
  hasCoinControl: boolean;
  hasDefaultStrategy: boolean;
}>;

export type Memo = { value: string; type?: string };

export type RecipientData = Readonly<{
  address?: string;
  ensName?: string;
  memo?: Memo;
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
  skipRecipientStep?: boolean;
  amount?: string;
  memo?: string;
  fromMAD?: boolean;
}>;

export function hasDirectRecipient(
  params: Pick<SendFlowInitParams, "recipient" | "skipRecipientStep"> | undefined,
): params is Pick<SendFlowInitParams, "recipient"> & {
  recipient: string;
  skipRecipientStep: true;
} {
  return params?.skipRecipientStep === true && Boolean(params.recipient?.trim());
}

export function canSkipRecipientStep(
  params: Pick<SendFlowInitParams, "recipient" | "skipRecipientStep"> | undefined,
  uiConfig: Pick<SendFlowUiConfig, "hasMemo">,
): boolean {
  return hasDirectRecipient(params) && !uiConfig.hasMemo;
}

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
  isRecipientAddressComplete: boolean;
  setIsRecipientAddressComplete: (value: boolean) => void;
  close: () => void;
  setAccountAndNavigate: (account: AccountLike, parentAccount?: Account) => void;
}>;
