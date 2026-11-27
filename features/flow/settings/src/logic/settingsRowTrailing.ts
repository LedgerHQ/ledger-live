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
