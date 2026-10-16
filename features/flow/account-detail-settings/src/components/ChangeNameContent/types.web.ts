export type ChangeNameContentProps = Readonly<{
  initialName: string;
  maxLength: number;
  isDisabled?: boolean;
  onConfirm: (name: string) => void;
}>;

export type ChangeNameContentViewProps = Readonly<{
  value: string;
  maxLength: number;
  label: string;
  submitLabel: string;
  isSubmitDisabled: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}>;
