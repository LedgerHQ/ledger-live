import { cn } from "@ledgerhq/lumen-utils-shared";
import type { DiffLine, DiffState } from "../../utils";

interface FlagDiffViewProps {
  readonly diff: DiffLine[];
}

/** Maps a semantic diff state to its gutter sign and Lumen classes. */
const STATE_STYLES: Record<DiffState, { sign: string; className: string }> = {
  added: { sign: "+", className: "bg-success-transparent text-success" },
  removed: { sign: "-", className: "bg-error-transparent text-error" },
  none: { sign: " ", className: "text-muted" },
};

/**
 * Read-only, line-by-line rendering of a JSON diff. Consumes the platform-free
 * `DiffLine[]` and is the only place that turns each `state` into web styling.
 */
export function FlagDiffView({ diff }: FlagDiffViewProps) {
  return (
    <pre className="block bg-canvas-muted body-3 w-full font-mono rounded-md min-h-[200px] p-8 overflow-auto">
      {diff.map(({ state, text }, index) => {
        const { sign, className } = STATE_STYLES[state];
        return (
          <div key={`${index}-${state}-${text}`} className={cn("whitespace-pre", className)}>
            {sign} {text}
          </div>
        );
      })}
    </pre>
  );
}
