import type { SettingsOption } from "../SettingsOptionList.types";

const COMBINING_MARKS = /[̀-ͯ]/g;

function normalize(text: string): string {
  return text.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase().trim();
}

/** Keeps the options whose label or code contains the query, ignoring case and accents. */
export function filterSettingsOptions(
  options: readonly SettingsOption[],
  query: string,
): readonly SettingsOption[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery === "") return options;

  return options.filter(
    option =>
      normalize(option.label).includes(normalizedQuery) ||
      (option.trailingText !== undefined &&
        normalize(option.trailingText).includes(normalizedQuery)),
  );
}
