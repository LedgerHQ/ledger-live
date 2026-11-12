import type { AccountSettingsEventHandler } from "../../logic/accountSettingsEvent";

export type RemoveAccountContentProps = Readonly<{
  onConfirm: () => void;
  onCancel: () => void;
  onEvent?: AccountSettingsEventHandler;
}>;

export type RemoveAccountContentLabels = Readonly<{
  title: string;
  description: string;
  confirm: string;
  cancel: string;
}>;

export type RemoveAccountContentViewProps = Pick<
  RemoveAccountContentProps,
  "onConfirm" | "onCancel"
> &
  Readonly<{ labels: RemoveAccountContentLabels }>;
