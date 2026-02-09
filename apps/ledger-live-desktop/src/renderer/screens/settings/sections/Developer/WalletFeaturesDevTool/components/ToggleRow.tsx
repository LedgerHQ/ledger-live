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
<<<<<<< HEAD
  <div className="flex items-center justify-between rounded-md bg-surface p-4">
    <div className="flex flex-col gap-1">
      <span className="body-3">{label}</span>
      {description && <span className="body-3 text-muted">{description}</span>}
=======
  <div className="flex items-center justify-between rounded-md bg-surface px-4 py-3">
    <div className="flex flex-col gap-1">
      <span className="body-3">{label}</span>
      {description && <span className="caption text-muted">{description}</span>}
>>>>>>> 3c88c2e14f (feat: lwd walletv4 tour ff and hasseen flag)
    </div>
    <Switch name={name} selected={selected} onChange={onChange} />
  </div>
);
