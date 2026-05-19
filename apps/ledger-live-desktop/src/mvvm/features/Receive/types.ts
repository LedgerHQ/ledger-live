export type ReceiveOptionsDialogProps = Readonly<{
  onClose: () => void;
  onGoToAccount: () => void;
  sourcePage?: string;
}>;

export const RECEIVE_SOURCE_PAGE = {
  ACCOUNT_PAGE: "Account Page",
  BANK: "Bank Page",
  SIDEBAR: "Sidebar",
} as const;
