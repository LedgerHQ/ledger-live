import { useState } from "react";
import type { CoinConfigToolProps, KeyDisplayState } from "../../types";
import { diffJsonLines, type DiffLine } from "./diff";

const JSON_INDENT = 2;

/** What the editor diffs the edited value against. */
export type DiffBaseline = "default" | "resolved";

export type EditorView = "json" | "review";

const toJson = (value: unknown) => JSON.stringify(value, null, JSON_INDENT) ?? "";

function parseJson(text: string): { valid: true; value: unknown } | { valid: false } {
  try {
    return { valid: true, value: JSON.parse(text) };
  } catch {
    return { valid: false };
  }
}

type ConfigEditorInput = Pick<CoinConfigToolProps, "setOverride" | "clearOverride"> & {
  display: KeyDisplayState;
};

export interface ConfigEditorState {
  json: string;
  setJson: (json: string) => void;
  isJsonValid: boolean;
  applyDisabled: boolean;
  apply: () => void;
  restore: () => void;
  view: EditorView;
  setView: (view: EditorView) => void;
  /** Empty while the JSON view is shown, so typing never pays for the diff. */
  diffJson: DiffLine[];
  diffBaseline: DiffBaseline;
  setDiffBaseline: (baseline: DiffBaseline) => void;
}

/** The JSON of one key: it starts from the resolved value and overrides it once it parses. */
export function useConfigEditor({
  display,
  setOverride,
  clearOverride,
}: ConfigEditorInput): ConfigEditorState {
  const [draft, setDraft] = useState<string | null>(null);
  const [diffBaseline, setDiffBaseline] = useState<DiffBaseline>("default");
  const [view, setView] = useState<EditorView>("json");

  const resolvedJson = toJson(display.resolved);
  const json = draft ?? resolvedJson;
  const parsed = parseJson(json);

  const apply = () => {
    if (!parsed.valid) return;
    setOverride(display.key, parsed.value);
    setDraft(null);
  };

  const baseJson = () => (diffBaseline === "default" ? toJson(display.defaultValue) : resolvedJson);

  const restore = () => {
    clearOverride(display.key);
    setDraft(null);
  };

  return {
    json,
    setJson: setDraft,
    isJsonValid: parsed.valid,
    applyDisabled: !parsed.valid || toJson(parsed.value) === resolvedJson,
    apply,
    restore,
    view,
    setView,
    diffJson: view === "review" ? diffJsonLines(baseJson(), json) : [],
    diffBaseline,
    setDiffBaseline,
  };
}
