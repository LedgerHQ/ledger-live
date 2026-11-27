import type { GeneralSettingsData, GeneralSettingUpdate, GeneralSideEffects } from "../ports";

type SupportedChoices = Pick<GeneralSettingsData, "languages" | "currencies">;

function isListed(choices: SupportedChoices["languages"], value: string): boolean {
  return choices.some(choice => choice.value === value);
}

/** Runs the side effect of one change. A language or currency the app does not list is ignored. */
export function applyGeneralSettingUpdate(
  effects: GeneralSideEffects,
  update: GeneralSettingUpdate,
  { languages, currencies }: SupportedChoices,
): void {
  switch (update.key) {
    case "theme":
      effects.setTheme(update.value);
      return;
    case "language":
      if (isListed(languages, update.value)) effects.setLanguage(update.value);
      return;
    case "currency":
      if (isListed(currencies, update.value)) effects.setCurrency(update.value);
      return;
  }
}
