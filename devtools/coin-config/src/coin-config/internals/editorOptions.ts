import type { DiffBaseline, EditorView } from "./useConfigEditor";

export interface EditorOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export const EDITOR_VIEWS: readonly EditorOption<EditorView>[] = [
  { value: "json", label: "JSON Editor" },
  { value: "review", label: "Review Changes" },
];

export const DIFF_BASELINES: readonly EditorOption<DiffBaseline>[] = [
  { value: "default", label: "Defaults" },
  { value: "resolved", label: "Resolved" },
];
