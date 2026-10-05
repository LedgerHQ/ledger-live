export type ChangePasswordSheetProps = Readonly<{
  isOpen: boolean;
  bottomInset?: number;
  onChange: () => void;
  /** Called once the sheet has left the screen, for a caller that has to wait for it. */
  onHidden?: () => void;
}>;
