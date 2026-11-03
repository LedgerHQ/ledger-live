import { TFunction } from "i18next";
import { BigNumber } from "bignumber.js";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { OpenModal } from "~/renderer/actions/modals";
export type StepId = "token" | "connectDevice" | "confirmation";

export type TokenAction = "add" | "edit" | "remove";

// The title, step texts and success texts of each action
export const ACTION_I18N = {
  add: "xrp.addToken",
  edit: "xrp.editLimit",
  remove: "xrp.removeToken",
} as const satisfies Record<TokenAction, string>;

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: Account | undefined | null;
  parentAccount: Account | undefined | null;
  onRetry: () => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  warning: Error | undefined;
  signed: boolean;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  maxLimit: BigNumber | null;
  setMaxLimit: (a: BigNumber | null) => void;
  action: TokenAction;
  tokenAccount: TokenAccount | undefined;
};
export type AddTokenStep = Step<StepId, StepProps>;
