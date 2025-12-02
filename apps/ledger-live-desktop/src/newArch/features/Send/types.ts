import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  FlowNavigationDirection,
  FlowNavigationActions,
  FlowStepConfig,
  FlowConfig,
  FlowStatus,
  FlowStatusActions,
} from "../FlowWizard/types";

export const SEND_FLOW_STEP = {
  ACCOUNT_SELECTION: "ACCOUNT_SELECTION",
  RECIPIENT: "RECIPIENT",
  AMOUNT: "AMOUNT",
  SIGNATURE: "SIGNATURE",
  CONFIRMATION: "CONFIRMATION",
};

export type SendFlowStep = (typeof SEND_FLOW_STEP)[keyof typeof SEND_FLOW_STEP];

export type SendStepConfig = FlowStepConfig<SendFlowStep>;
export type SendFlowConfig = FlowConfig<SendFlowStep>;
export type NavigationDirection = FlowNavigationDirection;
export type SendFlowNavigationActions = FlowNavigationActions<SendFlowStep>;

export type SendFlowCurrencyConfig = Readonly<{
  hasMemo?: boolean;
  memoLabel?: string;
  memoPlaceholder?: string;
  hasDestinationTag?: boolean;
}>;

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
  currencyConfig: SendFlowCurrencyConfig;
  uiConfig: SendFlowUiConfig;
  close: () => void;
  setAccountAndNavigate: (account: AccountLike, parentAccount?: Account) => void;
}>;

export type SendFlowContextValue = SendFlowBusinessContext &
  Readonly<{
    navigation: SendFlowNavigationActions;
    currentStep: SendFlowStep;
    direction: NavigationDirection;
    currentStepConfig: SendStepConfig;
  }>;
