import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import { cn } from "@ledgerhq/lumen-design-core/cn";
import type { ReactNode } from "react";
import {
  DIFF_BASELINES,
  EDITOR_VIEWS,
  type EditorOption,
} from "../../coin-config/internals/editorOptions";
import type { ConfigEditorState } from "../../coin-config/internals/useConfigEditor";
import { ConfigDiffView } from "../configDiffView/ConfigDiffView";

export type ConfigJsonEditorProps = Readonly<
  Pick<
    ConfigEditorState,
    | "json"
    | "setJson"
    | "isJsonValid"
    | "view"
    | "setView"
    | "diffJson"
    | "diffBaseline"
    | "setDiffBaseline"
  >
>;

function ToggleGroup<T extends string>({
  options,
  selected,
  onSelect,
  children,
}: Readonly<{
  options: readonly EditorOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  children?: ReactNode;
}>) {
  return (
    <div className="flex items-center gap-8 bg-canvas p-8">
      {children}
      {options.map(option => (
        <Button
          key={option.value}
          appearance="no-background"
          size="sm"
          className={cn({ "bg-active-subtle": option.value === selected })}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function ConfigJsonEditor({
  json,
  setJson,
  isJsonValid,
  view,
  setView,
  diffJson,
  diffBaseline,
  setDiffBaseline,
}: ConfigJsonEditorProps) {
  return (
    <div className="rounded-md bg-canvas-muted">
      <ToggleGroup options={EDITOR_VIEWS} selected={view} onSelect={setView} />
      <Divider />
      {view === "json" ? (
        <textarea
          aria-label="JSON value"
          aria-invalid={!isJsonValid}
          className={cn(
            "block min-h-[200px] w-full resize-none overflow-hidden rounded-md bg-canvas-muted p-8 font-mono body-3 text-base outline-none [field-sizing:content]",
            { "border-2 border-error": !isJsonValid },
          )}
          value={json}
          onChange={event => setJson(event.target.value)}
        />
      ) : (
        <>
          <ConfigDiffView diff={diffJson} />
          <Divider />
          <ToggleGroup options={DIFF_BASELINES} selected={diffBaseline} onSelect={setDiffBaseline}>
            <span className="body-3 text-muted">Compare with:</span>
          </ToggleGroup>
        </>
      )}
    </div>
  );
}
