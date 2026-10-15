export type RemoveAccountContentProps = Readonly<{
  onConfirm: () => void;
  onCancel: () => void;
}>;

export type RemoveAccountContentLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type RemoveAccountContentViewProps = RemoveAccountContentProps &
  Readonly<{ labels: RemoveAccountContentLabels }>;
