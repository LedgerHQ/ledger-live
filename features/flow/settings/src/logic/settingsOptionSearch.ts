type SearchableOption = Readonly<{ value: string; label: string; description?: string }>;

/** Whether an option matches a search: its label, description (e.g. a ticker) or value. */
export function matchesSettingsOption(option: SearchableOption, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [option.label, option.description, option.value].some(text =>
    text?.toLowerCase().includes(needle),
  );
}
