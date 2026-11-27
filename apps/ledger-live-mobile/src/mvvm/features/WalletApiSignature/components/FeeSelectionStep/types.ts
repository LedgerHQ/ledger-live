import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SourceFlow } from "LLM/components/DeviceIntentExecutor";

export type FeeSelectionStepProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | undefined;
  /** The transaction sent by the live app, before `prepareTransaction`. */
  transaction: Transaction;
  hasFeesProvided: boolean;
  manifestId: string;
  manifestName: string;
  sourceFlow: SourceFlow;
  isOpen: boolean;
  /** Gets the prepared transaction, with the fees the user chose. */
  onConfirm: (transaction: Transaction) => void;
  onReject: () => void;
  /** Fires once the sheet has left the screen. */
  onHidden: () => void;
}>;
