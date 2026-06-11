import { Switch } from "@ledgerhq/lumen-ui-react";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../../types";
import { FlagEnableIndicator } from "../flagEnableIndicator/FlagEnableIndicator";
import { cn } from "@ledgerhq/lumen-utils-shared";

interface FlagRowProps {
  readonly display: FlagDisplayState;
  readonly setOverride: FeatureFlagsToolProps["setOverride"];
}

export function FlagRow({ display, setOverride }: FlagRowProps) {
  const { id, resolved, isOverridden } = display;
  return (
    <div
      className={cn(
        "flex justify-between p-8 transition-colors duration-150",
        isOverridden ? "bg-active-subtle hover:bg-active-subtle-hover" : "hover:bg-muted-hover",
      )}
    >
      <div className="flex gap-16 items-center">
        <div className="max-sm:hidden">
          <FlagEnableIndicator enabled={resolved.enabled} />
        </div>
        <span className="body-2 font-mono">{id}</span>
      </div>
      <Switch
        selected={resolved.enabled}
        onChange={selected => setOverride(id, { ...resolved, enabled: selected })}
      />
    </div>
  );
}
