import { cn } from "@ledgerhq/lumen-design-core/cn";
import { DIFF_SIGNS, type DiffLine, type DiffState } from "../../coin-config/internals/diff";

const LINE_CLASSES: Record<DiffState, string> = {
  added: "bg-success-transparent text-success",
  removed: "bg-error-transparent text-error",
  none: "text-muted",
};

export function ConfigDiffView({ diff }: Readonly<{ diff: DiffLine[] }>) {
  return (
    <pre className="block min-h-[200px] w-full overflow-auto rounded-md bg-canvas-muted p-8 font-mono body-3">
      {diff.map((line, index) => (
        <div
          key={`${index}-${line.state}`}
          className={cn("whitespace-pre", LINE_CLASSES[line.state])}
        >
          {`${DIFF_SIGNS[line.state]} ${line.text}`}
        </div>
      ))}
    </pre>
  );
}
