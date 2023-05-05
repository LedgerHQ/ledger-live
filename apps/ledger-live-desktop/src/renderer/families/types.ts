import BigNumber from "bignumber.js";
import React from "react";
import { TFunction } from "react-i18next";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import { Unit, CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  Account,
  ChildAccount,
  FeeStrategy,
  Operation,
  OperationType,
  TokenAccount,
  TransactionCommon,
} from "@ledgerhq/types-live";
// FIXME: ideally we need to have <A,T,TS> parametric version of StepProps
import { StepProps as SendStepProps } from "../modals/Send/types";
import { StepProps as ReceiveStepProps } from "../modals/Receive/Body";
import { StepProps as AddAccountsStepProps } from "../modals/AddAccounts";
import { Modals } from "../modals";

/**
 * LLD family specific that a coin family can implement
 */
export type LLDCoinFamily<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatus
> = {
  operationDetails?: {
    /**
     * TODO document me
     */
    amountCellExtra?: Partial<
      Record<
        OperationType,
        React.ComponentType<{
          operation: Operation;
          unit: Unit;
          currency: CryptoCurrency;
        }>
      >
    >;

    /**
     * TODO document me
     */
    amountCell?: Partial<
      Record<
        OperationType,
        React.ComponentType<{
          amount: BigNumber;
          operation: Operation;
          unit: Unit;
          currency: CryptoCurrency;
        }>
      >
    >;

    /**
     * TODO document me
     */
    confirmationCell?: Partial<
      Record<
        OperationType,
        React.ComponentType<{
          operation: Operation;
          type?: OperationType;
          isConfirmed: boolean;
          marketColor: string;
          hasFailed?: boolean;
          t: TFunction;
          withTooltip?: boolean;
          style?: React.CSSProperties;
        }>
      >
    >;

    /**
     * TODO document me
     */
    amountTooltip?: Partial<
      Record<
        OperationType,
        React.ComponentType<{
          operation: Operation;
          unit: Unit;
          amount: BigNumber;
        }>
      >
    >;

    /**
     * TODO document me
     */
    getURLWhatIsThis?: (_: { op: Operation; currencyId: string }) => string | undefined;

    /**
     * TODO document me
     */
    getURLFeesInfo?: (_: { op: Operation; currencyId: string }) => string | undefined;
  };

  /**
   * TODO document me
   */
  OperationDetailsExtra?: React.ComponentType<{
    operation: Operation;
    account: A;
    type: OperationType;
    extra: {
      [key: string]: string;
    };
  }>;

  accountActions?: {
    /**
     * TODO document me
     */
    SendAction?: React.ComponentType<{
      account: A | TokenAccount | ChildAccount;
      parentAccount: A | null | undefined;
      onClick: () => void;
    }>;

    /**
     * TODO document me
     */
    ReceiveAction?: React.ComponentType<{
      account: TokenAccount | A | ChildAccount;
      parentAccount: A | null | undefined;
      onClick: () => void;
    }>;
  };

  /**
   * TODO document me
   */
  accountHeaderManageActions?: (_: {
    account: A | TokenAccount | ChildAccount;
    parentAccount: A | null | undefined;
    source?: string;
  }) => ManageAction[] | null | undefined;

  /**
   * TODO document me
   */
  transactionConfirmFields?: {
    fieldComponents?: Record<string, React.ComponentType<FieldComponentProps<A, T, TS>>>;

    warning?: React.ComponentType<{
      account: A | TokenAccount | ChildAccount;
      parentAccount: A | null | undefined;
      transaction: T;
      status: TS;
      recipientWording: string;
    }>;

    title?: React.ComponentType<{
      account: A | TokenAccount | ChildAccount;
      parentAccount: A | null | undefined;
      transaction: T;
      status: TS;
    }>;

    footer?: React.ComponentType<{
      transaction: T;
    }>;
  };

  /**
   * TODO document me
   */
  AccountBodyHeader?: React.ComponentType<{
    account: A | TokenAccount | ChildAccount;
    parentAccount: A | null | undefined;
  }>;

  /**
   * TODO document me
   */
  AccountSubHeader?: React.ComponentType<{
    account: A | TokenAccount | ChildAccount;
    parentAccount: A | null | undefined;
  }>;

  /**
   * TODO document me
   */
  sendAmountFields?: {
    component: React.ComponentType<{
      account: A;
      transaction: T;
      status: TS;
      onChange: (t: T) => void;
      updateTransaction: (updater: (t: T) => T) => void;
      mapStrategies?: (a: FeeStrategy) => FeeStrategy;
      bridgePending?: boolean;
      trackProperties?: Record<string, unknown>;
    }>;
    fields?: string[];
  };

  /**
   * TODO document me
   */
  sendRecipientFields?: {
    component: React.ComponentType<{
      account: A;
      transaction: T;
      status: TS;
      onChange: (t: T) => void;
    }>;
    fields?: string[];
  };

  /**
   * TODO document me
   */
  sendWarning?: {
    // FIXME: StepProps is not the right type here: we could precide the type with A,T,TS
    component: React.ComponentType<SendStepProps>;
    footer: React.ComponentType<SendStepProps>;
  };

  /**
   * TODO document me
   */
  receiveWarning?: {
    // FIXME: StepProps is not the right type here: we could precide the type with A,T,TS
    component: React.ComponentType<ReceiveStepProps>;
    footer: React.ComponentType<ReceiveStepProps>;
  };

  /**
   * TODO document me
   */
  AccountBalanceSummaryFooter?: React.ComponentType<{
    account: A | TokenAccount | ChildAccount;
    counterValue: Currency;
    discreetMode: boolean;
  }>;

  /**
   * TODO document me
   */
  tokenList?: {
    hasSpecificTokenWording?: boolean;
    ReceiveButton?: React.ComponentType<{
      account: A;
      onClick: () => void;
    }>;
  };

  /**
   * TODO document me
   */
  StepReceiveFunds?: React.ComponentType<ReceiveStepProps>;

  /**
   * TODO document me
   */
  StepReceiveFundsPostAlert?: React.ComponentType<ReceiveStepProps>;

  /**
   * TODO document me
   */
  NoAssociatedAccounts?: React.ComponentType<AddAccountsStepProps>;

  /**
   * TODO document me
   */
  StakeBanner?: React.ComponentType<{
    account: A;
  }>;

  /**
   * all modals that are specific to this family
   */
  modals?: Modals;
};

export type FieldComponentProps<
  A extends Account,
  T extends TransactionCommon,
  TS extends TransactionStatus
> = {
  account: A | TokenAccount | ChildAccount;
  parentAccount: A | undefined | null;
  transaction: T;
  status: TS;
  field: DeviceTransactionField;
};

export type ManageAction = {
  key: string;
  label: React.ReactElement;
  onClick: () => void;
  event?: string;
  eventProperties?: Record<string, unknown>;
  icon:
    | React.ComponentType<{
        size: number;
        overrideColor: string;
        currency: TokenCurrency | CryptoCurrency;
      }>
    | ((a: { size: number }) => React.ReactElement);
  disabled?: boolean;
  tooltip?: string;
  accountActionsTestId?: string;
};

// the AllCoinFamilies type is the only time we accept to go "any" because it's the generated entry point where the bridge is rooted.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AllCoinFamilies = Record<string, LLDCoinFamily<any, any, any>>;
