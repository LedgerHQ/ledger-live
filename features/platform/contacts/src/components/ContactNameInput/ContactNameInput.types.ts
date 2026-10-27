export type ContactNameInputProps = Readonly<{
  value: string;
  placeholder: string;
  errorMessage?: string;
  isEditable?: boolean;
  /** @platform native Focuses the field once the host sheet has settled. */
  autoFocus?: boolean;
  /** Namespaces the test ids, so each host identifies its own input. */
  testIDPrefix?: string;
  onChangeName: (name: string) => void;
}>;
