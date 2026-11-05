import type { ContactId } from "@domain/entity-contact";

export type PaySuccessRecipient = Readonly<{
  id: ContactId;
  name: string;
  isMe: boolean;
}>;

export type PaySuccessProps = Readonly<{
  recipient?: PaySuccessRecipient;
  recipientLabel: string;
  amountFormatted: string;
  /** The summary (amount, estimated time, From) shows only when it is set. */
  fromAccountName?: string;
  networkIcon?: Readonly<{ ledgerId: string; ticker: string }>;
  estimatedTime?: string;
  /** Hides the View transaction action when false. Defaults to true. */
  canViewTransaction?: boolean;
  onViewTransaction: () => void;
  onClose: () => void;
}>;
