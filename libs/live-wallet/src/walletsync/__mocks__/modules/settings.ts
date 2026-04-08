import type { SettingsLocalState } from "../../modules/settings";

type DistantState = { language?: string; counterValue?: string };

export const emptyState: SettingsLocalState = {
  language: "",
  counterValue: "USD",
};

export const genState = (index: number): SettingsLocalState => {
  const languages = ["en", "fr", "es", "de", "pt", "ja", "ko", "zh"];
  const currencies = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "BRL"];
  return {
    language: languages[index % languages.length],
    counterValue: currencies[index % currencies.length],
  };
};

export const convertLocalToDistantState = (localState: SettingsLocalState): DistantState => ({
  language: localState.language || undefined,
  counterValue: localState.counterValue || undefined,
});

export const convertDistantToLocalState = (distantState: DistantState): SettingsLocalState => ({
  language: distantState.language ?? "",
  counterValue: distantState.counterValue ?? "USD",
});

export const similarLocalState = (a: SettingsLocalState, b: SettingsLocalState): boolean =>
  a.language === b.language && a.counterValue === b.counterValue;
