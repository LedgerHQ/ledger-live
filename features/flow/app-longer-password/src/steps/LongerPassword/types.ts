export type LongerPasswordStep = "prompt" | "closing" | "enter" | "confirm" | "done";

export type LongerPasswordViewModel = Readonly<{
  step: LongerPasswordStep;
  hasSaveFailed: boolean;
  onChangeRequested: () => void;
  onPromptHidden: () => void;
  onEntered: () => void;
  onConfirmed: (password: string) => Promise<void>;
  onDone: () => void;
}>;

export type UseLongerPasswordViewModelOptions = Readonly<{
  savePassword: (password: string) => Promise<void>;
}>;

export type LongerPasswordViewProps = LongerPasswordViewModel &
  Readonly<{
    topInset?: number;
    bottomInset?: number;
    keyboardHeight?: number;
  }>;
