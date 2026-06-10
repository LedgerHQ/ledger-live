import { Switch } from "@ledgerhq/lumen-ui-react";
import type { FeatureFlagsToolProps, FlagDisplayState } from "../../types";
import { FlagEnableIndicator } from "../flagEnableIndicator/FlagEnableIndicator";
import { cn } from "@ledgerhq/lumen-utils-shared";

interface FlagRowProps {
  readonly display: FlagDisplayState;
  readonly setOverride: FeatureFlagsToolProps["setOverride"];
  readonly onSelect: () => void;
}

export function FlagRow({ display, setOverride, onSelect }: FlagRowProps) {
  const { id, resolved, isOverridden } = display;
  return (
    <div
      className={cn(
        "flex justify-between transition-colors duration-150",
        isOverridden ? "bg-active-subtle hover:bg-active-subtle-hover" : "hover:bg-muted-hover",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex gap-16 items-center w-full text-left cursor-pointer p-8"
      >
        <div className="max-sm:hidden">
          <FlagEnableIndicator enabled={resolved.enabled} />
        </div>
        <span className="body-2 font-mono">{id}</span>
      </button>

      <div className="flex items-center shrink-0 p-8">
        <Switch
          selected={resolved.enabled}
          onChange={selected => setOverride(id, { ...resolved, enabled: selected })}
        />
      </div>
    </div>
  );
}
