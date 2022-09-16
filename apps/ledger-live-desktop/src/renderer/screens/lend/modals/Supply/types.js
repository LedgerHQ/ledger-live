// @flow
import type { TFunction } from "react-i18next";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Step } from "~/renderer/components/Stepper";

import type { Account, AccountLike, TokenAccount, Operation } from "@ledgerhq/types-live";

import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ethereum/types";

export type StepId = "amount" | "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction,
  transitionTo: string => void,
  device: ?Device,
  account: ?TokenAccount,
  accounts: ?(AccountLike[]),
  currency: CryptoCurrency | TokenCurrency,
  parentAccount: ?Account,
  onRetry: void => void,
  onClose: () => void,
  openModal: (key: string, config?: any) => void,
  onChangeAccount: (nextAccount: AccountLike, nextParentAccount?: Account) => void,
  optimisticOperation: *,
  bridgeError: ?Error,
  transactionError: ?Error,
  signed: boolean,
  transaction: ?Transaction,
  status: TransactionStatus,
  onChangeTransaction: Transaction => void,
  onUpdateTransaction: (updater: (Transaction) => void) => void,
  onTransactionError: Error => void,
  onOperationBroadcasted: Operation => void,
  setSigned: boolean => void,
  bridgePending: boolean,
};

export type St = Step<StepId, StepProps>;
