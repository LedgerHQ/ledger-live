export type ReceiveOptionsDialogProps = Readonly<{
  onClose: () => void;
  onGoToAccount: () => void;
  sourcePage?: string;
}>;

export const RECEIVE_SOURCE_PAGE = {
  ACCOUNT: "account",
  ACCOUNT_CONTEXT_MENU: "account context menu",
  ALGORAND: "algorand",
  BANK: "bank",
  HEDERA: "hedera",
  NO_FUNDS_STAKE: "no funds stake modal",
  SIDEBAR: "sidebar",
  TEZOS: "tezos",
} as const;
