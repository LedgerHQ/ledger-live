import React from "react";
import { Switch } from "@ledgerhq/lumen-ui-react";

interface ToggleRowProps {
  readonly name: string;
  readonly label: string;
  readonly selected: boolean;
  readonly onChange: () => void;
  readonly description?: string;
}

export const ToggleRow = ({ name, label, selected, onChange, description }: ToggleRowProps) => (
  <div className="flex items-center justify-between rounded-md bg-surface p-4">
    <div className="flex flex-col gap-1">
      <span className="body-3">{label}</span>
      {description && <span className="body-3 text-muted">{description}</span>}
    </div>
    <Switch name={name} selected={selected} onChange={onChange} />
  </div>
);
