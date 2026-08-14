import { Switch } from "@ledgerhq/lumen-ui-react";

export interface ToggleRowProps {
  readonly label: string;
  readonly description?: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}

export function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-16">
      <div className="flex flex-col">
        <span className="body-3 text-base">{label}</span>
        {description ? <span className="body-4 text-muted font-mono">{description}</span> : null}
      </div>
      <Switch selected={checked} onChange={onChange} />
    </div>
  );
}
