import BigNumber from "bignumber.js";
import React from "react";
import { TFunction } from "i18next";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import {
  Unit,
  CryptoCurrency,
  Currency,
  TokenCurrency,
  ExplorerView,
} from "@ledgerhq/types-cryptoassets";
import {
  Account,
  AnyMessage,
  FeeStrategy,
  Operation,
  OperationType,
  TokenAccount,
  TransactionCommon,
  MessageProperties,
  AccountLike,
} from "@ledgerhq/types-live";
// FIXME: ideally we need to have <A,T,TS> parametric version of StepProps
import { StepProps as SendStepProps } from "../modals/Send/types";
import { StepProps as ReceiveStepProps } from "../modals/Receive/Body";
import { StepProps as AddAccountsStepProps } from "../modals/AddAccounts";
import { ModularDrawerAddAccountFlowManagerProps } from "LLD/features/AddAccountDrawer/ModularDrawerAddAccountFlowManager";

export type AddressCellProps<O extends Operation> = {
  operation: O;
  currency: CryptoCurrency;
};

export type AmountCellExtraProps<O extends Operation> = {
  operation: O;
  unit: Unit;
  currency: CryptoCurrency;
};

export type AmountCellProps<O extends Operation> = {
  amount: BigNumber;
  operation: O;
  unit: Unit;
  currency: CryptoCurrency;
};

export type ConfirmationCellProps<O extends Operation> = {
  operation: O;
  type?: OperationType;
  isConfirmed: boolean;
  marketColor: string;
  hasFailed?: boolean;
  t: TFunction;
  withTooltip?: boolean;
  style?: React.CSSProperties;
};

export type AmountTooltipProps<O extends Operation> = {
  operation: O;
  unit: Unit;
  amount: BigNumber;
};

export type OperationDetailsPostAccountSectionProps<A extends Account, O extends Operation> = {
  operation: O;
  account: A;
  type: OperationType;
};

export type OperationDetailsExtraProps<A extends Account, O extends Operation> = {
  operation: O;
  account: A;
  type: OperationType;
};

export type SummaryNetworkFeesRowProps = {
  feeTooHigh: Error;
  feesUnit: Unit;
  estimatedFees: BigNumber;
  feesCurrency: TokenCurrency | CryptoCurrency;
};

/**
 * LLD family specific that a coin family can implement
 * @template A is the account type of the family. you can set it to Account if there is no customisation of that type among the family.
 * @template T is the transaction type of the family.
 * @template TS is the transaction status type of the family.
 * @template O is the operation type of the family.
 */
export type LLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatus,
  O extends Operation,
> = {
  operationDetails?: {
    /**
     * Replace address cell
     */
    addressCell?: Partial<Record<OperationType, React.ComponentType<AddressCellProps<O>>>>;

    /**
     * Cell amount before the amount cell in operation row
     */
    amountCellExtra?: Partial<Record<OperationType, React.ComponentType<AmountCellExtraProps<O>>>>;

    /**
     * Replace amount cell
     */
    amountCell?: Partial<Record<OperationType, React.ComponentType<AmountCellProps<O>>>>;

    /**
     * Change operation first cell (mostly icons)
     */
    confirmationCell?: Partial<
      Record<OperationType, React.ComponentType<ConfirmationCellProps<O>>>
    >;

    /**
     * Tooltip on amount in operation details drawer (upper part of screen)
     */
    amountTooltip?: Partial<Record<OperationType, React.ComponentType<AmountTooltipProps<O>>>>;

    /**
     * Open external url on operation type with an icon info
     */
    getURLWhatIsThis?: (_: { op: O; currencyId: string }) => string | null | undefined;

    /**
     * Open external url on operation fees with an icon info
     */
    getURLFeesInfo?: (_: { op: O; currencyId: string }) => string | null | undefined;

    /**
     * Add custom component after the Account section in operation details drawer
     */
    OperationDetailsPostAccountSection?: React.ComponentType<
      OperationDetailsPostAccountSectionProps<A, O>
    >;

    /**
     * Add extra info
     */
    OperationDetailsExtra?: React.ComponentType<OperationDetailsExtraProps<A, O>>;

    /**
     * Add custom component at the end in operation details drawer
     */
    OperationDetailsPostAlert?: React.ComponentType<OperationDetailsExtraProps<A, O>>;
  };

  accountActions?: {
    /**
     * Custom Send button action on account page header
     */
    SendAction?: React.ComponentType<{
      account: A | TokenAccount;
      parentAccount: A | null | undefined;
      onClick: () => void;
    }>;

    /**
     * Custom Receive button action on account page header
     */
    ReceiveAction?: React.ComponentType<{
      account: A | TokenAccount;
      parentAccount: A | null | undefined;
      onClick: () => void;
    }>;
  };

  /**
   * allow to add buttons on account page header before swap and buy button
   */
  accountHeaderManageActions?: (_: {
    account: A | TokenAccount;
    parentAccount: A | null | undefined;
    source?: string;
  }) => ManageAction[] | null | undefined;

  /**
   * On confirmation screen device step allow to add multiple fields
   */
  transactionConfirmFields?: {
    fieldComponents?: Record<string, React.ComponentType<FieldComponentProps<A, T, TS>>>;

    warning?: React.ComponentType<{
      account: A | TokenAccount;
      parentAccount: A | null | undefined;
      transaction: T;
      status: TS;
      recipientWording: string;
    }>;

    title?: React.ComponentType<{
      account: A | TokenAccount;
      parentAccount: A | null | undefined;
      transaction: T;
      status: TS;
      device: Device;
    }>;

    footer?: React.ComponentType<{
      transaction: T;
    }>;
  };

  /**
   * Allow to add component between graph and delegations / operation details section
   */
  AccountBodyHeader?: React.ComponentType<{
    account: A | TokenAccount;
    parentAccount: A | null | undefined;
  }>;

  /**
   * Allow to add component below account body header
   */
  AccountSubHeader?: React.ComponentType<{
    account: A | TokenAccount;
    parentAccount: A | null | undefined;
  }>;

  AccountFooter?: React.ComponentType<{
    account: A | TokenAccount;
    parentAccount?: A | undefined | null;
    status: TS;
  }>;

  /**
   * Replace amount field on send modal
   */
  sendAmountFields?: {
    component: React.ComponentType<{
      account: A;
      /**
       * @deprecated use account instead
       */
      parentAccount: A | null | undefined;
      transaction: T;
      status: TS;
      onChange: (t: T) => void;
      updateTransaction: (updater: (t: T) => T) => void;
      mapStrategies?: (a: FeeStrategy) => FeeStrategy;
      bridgePending?: boolean;
      trackProperties?: Record<string, unknown>;
      transactionToUpdate?: T;
      disableEditGasLimit?: boolean;
    }>;
    fields?: string[];
  };

  /**
   * Allow to add component below recipient field
   *
   * FIXME: account will have to be A | TokenAccount
   */
  sendRecipientFields?: {
    component: React.ComponentType<{
      account: A;
      /**
       * @deprecated use account instead
       */
      parentAccount: A | undefined | null;
      transaction: T;
      status: TS;
      onChange: (t: T) => void;
    }>;
    fields?: string[];
  };

  /**
   * Allow to disable "Continue" button on Recipient step in Send modal
   */
  sendRecipientCanNext?: (status: TS) => boolean;

  /**
   *  One time modal that is trigger only one time on a account that never send
   */
  sendWarning?: {
    // FIXME: StepProps is not the right type here: we could precide the type with A,T,TS
    component: React.ComponentType<SendStepProps>;
    footer: React.ComponentType<SendStepProps>;
  };

  /**
   * One time modal that is trigger only one time on a account that never send
   */
  receiveWarning?: {
    // FIXME: StepProps is not the right type here: we could precide the type with A,T,TS
    component: React.ComponentType<ReceiveStepProps>;
    footer: React.ComponentType<ReceiveStepProps>;
  };

  /**
   * Component that change footer of graph
   */
  AccountBalanceSummaryFooter?: React.ComponentType<{
    account: A | TokenAccount;
    counterValue: Currency;
    discreetMode: boolean;
  }>;

  /**
   * Opt-in or allow to add token for coin that need
   */
  tokenList?: {
    hasSpecificTokenWording?: boolean;
    ReceiveButton?: React.ComponentType<{
      account: A;
      onClick: () => void;
    }>;
  };

  /**
   * Allow to add component below the token select on Account step in Receive modal
   */
  StepReceiveAccountCustomAlert?: React.ComponentType<ReceiveStepProps & { account: AccountLike }>;

  /**
   * Configuration for receive tokens mode using cal-client
   * When present, the receive flow will use useTokensData hook instead of listTokensForCryptoCurrency
   */
  receiveTokensConfig?: {
    /**
     * The network family to pass to useTokensData hook (e.g. "hedera")
     */
    networkFamily: string;
  };

  /**
   * Change Receive funds with this component (example: Hedera)
   */
  StepReceiveFunds?: React.ComponentType<ReceiveStepProps>;

  /**
   * Allow to add component below the confirmation address box on receive step
   */
  StepReceiveFundsPostAlert?: React.ComponentType<ReceiveStepProps>;

  /**
   * Replace Networkfees row on Summary Step
   */
  StepSummaryNetworkFeesRow?: React.ComponentType<SummaryNetworkFeesRowProps>;

  /**
   * Allow to add specific component in Send modal below the recipient address
   */
  StepRecipientCustomAlert?: React.ComponentType<{ status: TS }>;

  /**
   * Allow to add specific component in Send modal at the end of Summary Step
   */
  StepSummaryAdditionalRows?: React.ComponentType<{
    account: A | TokenAccount;
    parentAccount: A | null | undefined;
    transaction: T;
    status: TS;
  }>;

  /**
   * It was for Hedera specifc, when we do not find any account it show a specific component
   */
  NoAssociatedAccounts?: React.ComponentType<AddAccountsStepProps>;

  /**
   * Component banner before Account body header
   */
  StakeBanner?: React.ComponentType<{
    account: A;
  }>;

  /**
   * Component to display pending transfer proposals
   */
  PendingTransferProposals?: React.ComponentType<{
    account: A;
    parentAccount: A;
  }>;

  /**
   * Customize the way the explorer URL to a transaction is built
   */
  getTransactionExplorer?: (
    explorerView: ExplorerView | null | undefined,
    operation: Operation,
  ) => string | null | undefined;

  message?: {
    getMessageProperties: (message: AnyMessage) => Promise<MessageProperties | null>;
  };

  /**
   * Component allowing to fully customize the add account flow in the drawer
   */
  ModularDrawerAddAccountFlowManager?: React.ComponentType<ModularDrawerAddAccountFlowManagerProps>;
};

export type FieldComponentProps<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatus,
> = {
  account: A | TokenAccount;
  parentAccount: A | undefined | null;
  transaction: T;
  status: TS;
  field: DeviceTransactionField;
};

export type IconType = {
  size: number;
  overrideColor: string;
  currency: TokenCurrency | CryptoCurrency;
};

export type ManageAction = {
  key: string;
  label: React.ReactNode;
  onClick: () => void;
  event?: string;
  eventProperties?: Record<string, unknown>;
  icon: React.ComponentType<IconType> | ((a: { size: number }) => React.ReactElement);
  disabled?: boolean;
  tooltip?: string;
  accountActionsTestId?: string;
};
