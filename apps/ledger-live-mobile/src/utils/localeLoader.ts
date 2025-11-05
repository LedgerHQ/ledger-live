const loadedLanguages = new Set<string>();

/**
 * Dynamically loads locale data for a specific language
 * @param language - The language code (e.g., 'en', 'fr', 'es')
 */
export const loadLocaleData = (language: string): void => {
  if (loadedLanguages.has(language)) {
    return;
  }

  try {
    switch (language) {
      case "en":
        require("@formatjs/intl-pluralrules/locale-data/en");
        require("@formatjs/intl-relativetimeformat/locale-data/en");
        break;
      case "fr":
        require("@formatjs/intl-pluralrules/locale-data/fr");
        require("@formatjs/intl-relativetimeformat/locale-data/fr");
        break;
      case "es":
        require("@formatjs/intl-pluralrules/locale-data/es");
        require("@formatjs/intl-relativetimeformat/locale-data/es");
        break;
      case "ru":
        require("@formatjs/intl-pluralrules/locale-data/ru");
        require("@formatjs/intl-relativetimeformat/locale-data/ru");
        break;
      case "zh":
        require("@formatjs/intl-pluralrules/locale-data/zh");
        require("@formatjs/intl-relativetimeformat/locale-data/zh");
        break;
      case "de":
        require("@formatjs/intl-pluralrules/locale-data/de");
        require("@formatjs/intl-relativetimeformat/locale-data/de");
        break;
      case "tr":
        require("@formatjs/intl-pluralrules/locale-data/tr");
        require("@formatjs/intl-relativetimeformat/locale-data/tr");
        break;
      case "ja":
        require("@formatjs/intl-pluralrules/locale-data/ja");
        require("@formatjs/intl-relativetimeformat/locale-data/ja");
        break;
      case "ko":
        require("@formatjs/intl-pluralrules/locale-data/ko");
        require("@formatjs/intl-relativetimeformat/locale-data/ko");
        break;
      case "pt":
        require("@formatjs/intl-pluralrules/locale-data/pt");
        require("@formatjs/intl-relativetimeformat/locale-data/pt");
        break;
      case "th":
        require("@formatjs/intl-pluralrules/locale-data/th");
        require("@formatjs/intl-relativetimeformat/locale-data/th");
        break;
      default:
        require("@formatjs/intl-pluralrules/locale-data/en");
        require("@formatjs/intl-relativetimeformat/locale-data/en");
        language = "en";
        break;
    }

    loadedLanguages.add(language);
  } catch (error) {
    if (language !== "en") {
      try {
        require("@formatjs/intl-pluralrules/locale-data/en");
        require("@formatjs/intl-relativetimeformat/locale-data/en");
        loadedLanguages.add("en");
      } catch (fallbackError) {
        console.error("Failed to load fallback locale data:", fallbackError);
      }
    }
  }
};

/**
 * Checks if locale data for a specific language has been loaded
 * @param language - The language code to check
 * @returns true if the language data has been loaded
 */
export const isLocaleDataLoaded = (language: string): boolean => {
  return loadedLanguages.has(language);
};

/**
 * Gets the list of loaded languages
 * @returns Array of loaded language codes
 */
export const getLoadedLanguages = (): string[] => {
  return Array.from(loadedLanguages);
};
