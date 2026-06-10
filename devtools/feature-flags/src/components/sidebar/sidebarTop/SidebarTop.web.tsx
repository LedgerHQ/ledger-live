import { Switch, Button } from "@ledgerhq/lumen-ui-react";
import type { FeatureId } from "@shared/feature-flags";
import { FlagDisplayState } from "../../../";
import { Close } from "@ledgerhq/lumen-ui-react/symbols";

export interface SidebarTopProps {
  readonly display: FlagDisplayState;
  readonly onClose?: () => void;
  readonly clearOverride: (key: FeatureId) => void;
  readonly toggleFeatureFlag: (enabled: boolean) => void;
}

export function SidebarTop({
  display,
  onClose,
  clearOverride,
  toggleFeatureFlag,
}: SidebarTopProps) {
  const { id, resolved, isOverridden } = display;
  return (
    <div className="p-16">
      <div className="flex justify-between items-center">
        <div>
          <h5 className="heading-5-semi-bold font-mono text-muted">Feature Flags</h5>
          <h3 className="heading-3 font-mono mt-4">{id}</h3>
        </div>
        <Close
          size={32}
          className="cursor-pointer p-4 hover:bg-muted-hover rounded-md"
          onClick={onClose}
        />
      </div>
      <div className="flex flex-auto items-center gap-16">
        <div className="flex gap-8 items-center w-full bg-canvas-muted p-16 rounded-md mt-4">
          <Switch selected={resolved.enabled} onChange={toggleFeatureFlag} />
          <div className="flex flex-col">
            <span className="body-2 ">{resolved.enabled ? "Enabled" : "Disabled"}</span>
            <span className="body-4 text-muted"> Local Override takes priority</span>
          </div>
        </div>
        {isOverridden && (
          <Button appearance="gray" className="body-2 py-8" onClick={() => clearOverride(id)}>
            Restore
          </Button>
        )}
      </div>
    </div>
  );
}
