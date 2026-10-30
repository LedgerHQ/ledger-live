export type DelegationValidator = Readonly<{
  name: string;
  imageUrl?: string;
  description?: string;
}>;

export type DelegationStatusAppearance = "success" | "warning" | "error" | "neutral";

export type DelegationStatus = Readonly<{
  label: string;
  appearance: DelegationStatusAppearance;
  tooltip?: string;
}>;

export type DelegationCell = Readonly<{
  value: string;
  /** Hidden when `discreet` is on. */
  sensitive?: boolean;
}>;

export type DelegationAction = Readonly<{
  id: string;
  label: string;
  disabledReason?: string;
}>;

export type DelegationColumn = Readonly<{
  id: string;
  label: string;
  align?: "start" | "end";
}>;

export type DelegationRow = Readonly<{
  id: string;
  validator: DelegationValidator;
  status?: DelegationStatus;
  cells: Readonly<Record<string, DelegationCell>>;
  actions: readonly DelegationAction[];
}>;

export type DelegationHeaderAction = Readonly<{
  id: string;
  label: string;
  /** Disables the action and shows this text in a tooltip. */
  disabledReason?: string;
}>;

export type DelegationEmptyState = Readonly<{
  description: string;
  learnMoreLabel?: string;
  actionLabel: string;
  actionDisabled?: boolean;
}>;

export type DelegationFooter = Readonly<{
  title: string;
  description: string;
  actionLabel?: string;
  actionDisabled?: boolean;
}>;

export type AccountDelegationsProps = Readonly<{
  title: string;
  /** @platform web Header of the validator column. Defaults to the title. */
  validatorColumnLabel?: string;
  /** @platform web The status column is shown only when this label is set. */
  statusColumnLabel?: string;
  columns: readonly DelegationColumn[];
  rows: readonly DelegationRow[];
  headerActions?: readonly DelegationHeaderAction[];
  emptyState?: DelegationEmptyState;
  footer?: DelegationFooter;
  loading?: boolean;
  discreet?: boolean;
  /** @platform web Name of the row actions button. Defaults to the validator name. */
  rowActionsLabel?: string;
  /** @platform native Entry of the row sheet that opens the validator. Needs `onOpenValidator`. */
  openValidatorLabel?: string;
  onOpenValidator?: (rowId: string) => void;
  onSelectRowAction: (rowId: string, actionId: string) => void;
  onSelectHeaderAction: (actionId: string) => void;
  onStartDelegating: () => void;
  onLearnMore?: () => void;
  onSelectFooterAction?: () => void;
  testID?: string;
}>;
