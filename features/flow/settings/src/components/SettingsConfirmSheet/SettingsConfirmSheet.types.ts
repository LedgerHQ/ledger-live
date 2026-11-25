export type SettingsConfirmSheetLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type SettingsConfirmSheetProps = Readonly<{
  isOpen: boolean;
  /** `destructive` for an action that cannot be undone (reset, clear), `neutral` otherwise. */
  tone: "destructive" | "neutral";
  labels: SettingsConfirmSheetLabels;
  /** Disables both actions while the confirmed action runs. */
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
  confirmTestID?: string;
  cancelTestID?: string;
}>;
