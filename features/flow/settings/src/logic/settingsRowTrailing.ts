import type {
  SettingsRowSelectOption,
  SettingsRowTrailing,
} from "../components/SettingsRow/SettingsRow.types";

type PressableTrailing = Extract<SettingsRowTrailing, { type: "chevron" | "externalLink" }>;

export function isPressableTrailing(
  trailing: SettingsRowTrailing | undefined,
): trailing is PressableTrailing {
  return trailing?.type === "chevron" || trailing?.type === "externalLink";
}

export function getSelectedOptionLabel(
  options: readonly SettingsRowSelectOption[],
  value: string,
): string | undefined {
  const selected = options.find(option => option.value === value);
  return selected?.shortLabel ?? selected?.label;
}

type SearchableOption = Readonly<{ value: string; label: string; description?: string }>;

/** Whether an option matches a search: its label, description (e.g. a ticker) or value. */
export function matchesSettingsOption(option: SearchableOption, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [option.label, option.description, option.value].some(text =>
    text?.toLowerCase().includes(needle),
  );
}
