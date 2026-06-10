import { Divider, Button } from "@ledgerhq/lumen-ui-react";
import { cn } from "@ledgerhq/lumen-utils-shared";
import { useState } from "react";
import { DiffLine } from "../../utils";
import { FlagDiffView } from "../flagDiffView/FlagDiffView.web";
import type { DiffBaseline } from "../../hooks";

export interface FlagJsonEditorProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly isValidJson: boolean;
  readonly diffJson: DiffLine[];
  readonly diffBaseline: DiffBaseline;
  readonly setDiffBaseline: (baseline: DiffBaseline) => void;
}

export function FlagJsonEditor({
  value,
  onChange,
  isValidJson,
  diffJson,
  diffBaseline,
  setDiffBaseline,
}: FlagJsonEditorProps) {
  const [onJsonEditor, setOnJsonEditor] = useState<boolean>(true);
  return (
    <div className="bg-canvas-muted rounded-md">
      <div className="flex items-center gap-8 p-8 bg-canvas">
        <Button
          appearance="no-background"
          size="sm"
          className={cn({ "bg-active-subtle": onJsonEditor })}
          onClick={() => setOnJsonEditor(true)}
        >
          JSON Editor
        </Button>
        <Button
          appearance="no-background"
          size="sm"
          className={cn({ "bg-active-subtle": !onJsonEditor })}
          onClick={() => setOnJsonEditor(false)}
        >
          Review Changes
        </Button>
      </div>
      <Divider />
      {onJsonEditor ? (
        <textarea
          className={cn(
            "block bg-canvas-muted body-3 w-full font-mono rounded-md outline-none min-h-[200px] p-8 overflow-hidden resize-none [field-sizing:content]",
            {
              "border-2 border-error": !isValidJson,
            },
          )}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <>
          <FlagDiffView diff={diffJson} />
          <Divider />
          <div className="flex items-center gap-8 p-8 bg-canvas">
            <span className="body-3 text-muted">Compare with:</span>
            <Button
              appearance="no-background"
              size="sm"
              className={cn({ "bg-active-subtle": diffBaseline === "default" })}
              onClick={() => setDiffBaseline("default")}
            >
              Defaults
            </Button>
            <Button
              appearance="no-background"
              size="sm"
              className={cn({ "bg-active-subtle": diffBaseline === "resolved" })}
              onClick={() => setDiffBaseline("resolved")}
            >
              Resolved
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
