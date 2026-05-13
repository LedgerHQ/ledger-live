import { Switch } from "@ledgerhq/lumen-ui-react";

type PnlSwitchFieldProps = Readonly<{
  id: string;
  label: string;
  selected: boolean;
  onChange: (next: boolean) => void;
}>;

export function PnlSwitchField({ id, label, selected, onChange }: PnlSwitchFieldProps) {
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-16">
      <label htmlFor={id} className="body-3 text-muted">
        {label}
      </label>
      <Switch id={id} selected={selected} onChange={onChange} />
    </div>
  );
}
