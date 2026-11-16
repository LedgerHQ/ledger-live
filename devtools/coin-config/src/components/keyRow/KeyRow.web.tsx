import { cn } from "@ledgerhq/lumen-design-core/cn";
import type { KeyDisplayState } from "../../types";
import { Pill } from "../pill/Pill";

interface KeyRowProps {
  readonly display: KeyDisplayState;
  readonly onSelect: () => void;
}

export function KeyRow({ display, onSelect }: KeyRowProps) {
  const { key, valueType, isOverridden } = display;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-16 p-8 text-left transition-colors duration-150",
        isOverridden ? "bg-active-subtle hover:bg-active-subtle-hover" : "hover:bg-muted-hover",
      )}
    >
      <div className="max-sm:hidden">
        <Pill variant="muted" size={4}>
          {valueType}
        </Pill>
      </div>
      <span className="body-2 min-w-0 flex-1 truncate font-mono">{key}</span>
      {isOverridden && (
        <Pill variant="active" size={4}>
          Overridden
        </Pill>
      )}
    </button>
  );
}
