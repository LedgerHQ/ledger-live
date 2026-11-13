import type { TFunction } from "i18next";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Account, AccountLike, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import type { Step } from "~/renderer/components/Stepper";

export type StepId = "token" | "settings" | "review" | "connectDevice" | "confirmation";

export type TokenAction = "add" | "edit";

export const ACTION_I18N = {
  add: "xrp.addToken",
  edit: "xrp.tokenSettings",
} as const satisfies Record<TokenAction, string>;

export type StepProps = Readonly<{
  t: TFunction;
  transitionTo: (stepId: string) => void;
  device: Device | undefined | null;
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  onRetry: () => void;
  onClose: () => void;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onUpdateTransaction: (updater: (transaction: Transaction) => Transaction) => void;
  onTransactionError: (error: Error) => void;
  onOperationBroadcasted: (operation: Operation) => void;
  setSigned: (signed: boolean) => void;
  bridgePending: boolean;
  action: TokenAction;
  token: TokenCurrency | undefined;
  onChangeToken: (token: TokenCurrency | undefined | null) => void;
  isRippling: boolean;
  onChangeRippling: (isRippling: boolean) => void;
  tokenAccount: TokenAccount | undefined;
}>;

export type AddTokenStep = Step<StepId, StepProps>;
